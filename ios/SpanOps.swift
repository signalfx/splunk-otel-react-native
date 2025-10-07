/*
Copyright 2023 Splunk Inc.

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

fileprivate func randomPart() -> UInt64 {
    return UInt64.random(in: 1 ... .max)
}

fileprivate func traceId() -> String {
    return String(format: "%016llx%016llx", randomPart(), randomPart())
}

fileprivate func spanId() -> String {
    return String(format: "%016llx", randomPart())
}

fileprivate func timestamp() -> UInt64 {
    return UInt64(Date().timeIntervalSince1970 * 1e6)
}


protocol SpanExporter: AnyObject {
    func export(_ zipkinSpans: [ZipkinSpan]) -> Bool
    func export(spans: [Dictionary<String, Any>]) -> Bool
}

class NoopExporter: SpanExporter {
    func export(_ zipkinSpans: [ZipkinSpan]) -> Bool {
        return true
    }
    
    func export(spans: [Dictionary<String, Any>]) -> Bool {
        return true
    }
}

func newSpan(name: String) -> ZipkinSpan {
    return ZipkinSpan(
        traceId: traceId(),
        parentId: nil,
        id: spanId(),
        kind: nil,
        name: name,
        timestamp: timestamp(),
        duration: nil,
        remoteEndpoint: nil,
        annotations: [],
        tags: [:]
    )
}

func endSpan(exporter: SpanExporter, _ span: ZipkinSpan) {
    span.duration = timestamp() - span.timestamp
    _ = exporter.export([span])
}
