fileprivate var spanExporter: SpanToDiskExporter?

@objc(SplunkOtelReactNative)
class SplunkOtelReactNative: NSObject {

  @objc(initialize:withResolver:withRejecter:)
  func initialize(config: Dictionary<String, Any>, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {

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

      let db = SpanDb()
      spanExporter = SpanToDiskExporter(spanDb: db)

      SpanFromDiskExport.start(spanDb: db, endpoint: beaconWithAuth)
        
      resolve(true)
    }
    
    @objc(export:withResolver:withRejecter:)
    func export(spans: Array<Dictionary<String, Any>>, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        if spanExporter == nil {
            resolve(false)
            return
        }
        
        let exporter = spanExporter!
        resolve(exporter.export(spans: spans))
    }
}
