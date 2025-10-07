//
/*
Copyright 2022 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import Foundation
import DeviceKit

/*
Copyright 2022 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


class SpanToDiskExporter : SpanExporter {
    let db: SpanDb
    let maxFileSizeBytes: Int64
    // Count of spans to insert before checking whether truncation is necessary
    let truncationCheckpoint: Int64
    let deviceModel: String
    private var totalSpansInserted: Int64 = 0
    private var checkpointCounter: Int64 = 0

    init(spanDb: SpanDb, limitDiskUsageMegabytes: Int64, truncationCheckpoint: Int64) {
        self.db = spanDb
        self.maxFileSizeBytes = limitDiskUsageMegabytes * 1024 * 1024
        self.truncationCheckpoint = truncationCheckpoint
        self.deviceModel = Device.current.description
    }

    public func shutdown() {}

    public func export(spans: [Dictionary<String, Any>]) -> Bool {

        if !db.ready() {
            return false
        }

        let zipkinSpans = ZipkinTransform.toZipkinSpans(spans: spans)
        return export(zipkinSpans)
    }

    public func export(_ zipkinSpans: [ZipkinSpan]) -> Bool {
        let globalAttribs = Globals.getGlobalAttributes()
        let sessionId = Globals.getSessionId()
        
        let networkInfo = getNetworkInfo()

        for span in zipkinSpans {
            if span.tags["splunk.rumSessionId"] == nil && !sessionId.isEmpty {
                span.tags["splunk.rumSessionId"] = sessionId
            }

            if span.tags["device.model.name"] == nil {
                span.tags["device.model.name"] = self.deviceModel
            }            

            if networkInfo.hostConnectionType != nil {
                span.tags["net.host.connection.type"] = networkInfo.hostConnectionType!
            }

            if networkInfo.hostConnectionSubType != nil {
                span.tags["net.host.connection.subtype"] = networkInfo.hostConnectionSubType!
            }

            if networkInfo.carrierName != nil {
                span.tags["net.host.carrier.name"] = networkInfo.carrierName!
            }

            if networkInfo.carrierCountryCode != nil {
                span.tags["net.host.carrier.mcc"] = networkInfo.carrierCountryCode!
            }

            if networkInfo.carrierNetworkCode != nil {
                span.tags["net.host.carrier.mnc"] = networkInfo.carrierNetworkCode!
            }

            if networkInfo.carrierIsoCountryCode != nil {
                span.tags["net.host.carrier.icc"] = networkInfo.carrierIsoCountryCode!
            }
            
            for (key, attrib) in globalAttribs {
                if span.tags[key] == nil {
                    span.tags[key] = attrib
                }
            }
        }

        if !db.store(spans: zipkinSpans) {
            return true
        }

        let inserted = Int64(zipkinSpans.count)
        checkpointCounter += inserted

        // There might be a case where truncation checkpoint is never reached,
        // so do a size check / truncation after the first insert.
        if totalSpansInserted == 0 || checkpointCounter >= truncationCheckpoint {
            maybeTruncate()
        }

        totalSpansInserted += inserted

        return true
    }

    private func maybeTruncate() {
        guard let dbSize = db.getSize() else {
            return
        }

        if dbSize < self.maxFileSizeBytes {
            return
        }

        _ = db.truncate()

        checkpointCounter = 0
    }
}
