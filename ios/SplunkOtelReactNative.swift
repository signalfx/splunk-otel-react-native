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

fileprivate var spanExporter: SpanExporter = NoopExporter()

@objc(SplunkOtelReactNative)
class SplunkOtelReactNative: NSObject {
  private var appStartTime = Date()
  @objc(initialize:withResolver:withRejecter:)
  func initialize(config: Dictionary<String, Any>, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
      let db = SpanDb()
      spanExporter = SpanToDiskExporter(spanDb: db)
      initializeCrashReporting(exporter: spanExporter)

      print("Default appStartTime \(appStartTime)")
      do {
          appStartTime = try processStartTime()
          print("Processed appStartTime \(appStartTime)")
      } catch {
          // ignore
      }

      let beaconUrl = config["beaconEndpoint"] as? String

      if beaconUrl == nil {
          reject("error", "Missing beacon URL", nil)
          return
      }

      let auth = config["rumAccessToken"] as? String

      if auth == nil {
          reject("error", "Missing authentication token", nil)
          return
      }
      var beaconWithAuth = beaconUrl!
      beaconWithAuth += "?auth=" + auth!

      SpanFromDiskExport.start(spanDb: db, endpoint: beaconWithAuth)

      resolve(appStartTime.timeIntervalSince1970 * 1000)
    }

    @objc(export:withResolver:withRejecter:)
    func export(spans: Array<Dictionary<String, Any>>, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        resolve(spanExporter.export(spans: spans))
    }
    
    @objc(setSessionId:withResolver:withRejecter:)
    func setSessionId(id: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        Globals.setSessionId(id)
        updateCrashReportSessionId(id)
        resolve(true)
    }
    
    @objc(setGlobalAttributes:withResolver:withRejecter:)
    func setGlobalAttributes(attributes: Dictionary<String, Any>, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        let newAttribs: [String:TagValue] = attributes.compactMapValues { v in
            switch v {
            case is String:
                return TagValue.string(v as! String)
            case is Bool:
                return TagValue.bool(v as! Bool)
            case is Double:
                return TagValue.double(v as! Double)
            case is Int:
                return TagValue.int(v as! Int)
            default:
                return nil
            }
        }
        
        Globals.setGlobalAttributes(newAttribs)
        resolve(true)
    }
    
    private func processStartTime() throws -> Date {
        let name = "kern.proc.pid"
        var len: size_t = 4
        var mib = [Int32](repeating: 0, count: 4)
        var kp: kinfo_proc = kinfo_proc()
        try mib.withUnsafeMutableBufferPointer { (mibBP: inout UnsafeMutableBufferPointer<Int32>) throws in
            try name.withCString { (nbp: UnsafePointer<Int8>) throws in
                guard sysctlnametomib(nbp, mibBP.baseAddress, &len) == 0 else {
                    throw POSIXError(.EAGAIN)
                }
            }
            mibBP[3] = getpid()
            len =  MemoryLayout<kinfo_proc>.size
            guard sysctl(mibBP.baseAddress, 4, &kp, &len, nil, 0) == 0 else {
                throw POSIXError(.EAGAIN)
            }
        }
        // Type casts to finally produce the answer
        let startTime = kp.kp_proc.p_un.__p_starttime
        let ti: TimeInterval = Double(startTime.tv_sec) + (Double(startTime.tv_usec) / 1e6)
        return Date(timeIntervalSince1970: ti)
    }
}
