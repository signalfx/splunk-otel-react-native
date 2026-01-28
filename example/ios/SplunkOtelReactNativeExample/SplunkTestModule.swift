import Foundation
import UIKit

/**
 * Native module for testing SDK features from React Native.
 * Provides crash simulation, slow rendering, and network testing for iOS.
 */
@objc(SplunkTestModule)
class SplunkTestModule: NSObject {
  
  // MARK: - Constants
  
  private let slowRenderSleepSeconds: Double = 0.5

  private let frozenRenderSleepSeconds: Double = 2.0

  private let repeatCount: Int = 5

  private let repeatIntervalSeconds: Double = 0.5
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  // MARK: - Crash Simulation
  
  @objc
  func simulateCrash(_ resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      fatalError("Test crash triggered from React Native (iOS)")
    }
  }
  
  @objc
  func simulateANR(_ resolve: @escaping RCTPromiseResolveBlock,
                   reject: @escaping RCTPromiseRejectBlock) {
    reject("PLATFORM_ERROR", "ANR simulation is only available on Android", nil)
  }
  
  // MARK: - Slow/Frozen Rendering
  
  /// Simulates slow frames by blocking the main thread for 500ms multiple times.
  @objc
  func simulateSlowRender(_ resolve: @escaping RCTPromiseResolveBlock,
                          reject: @escaping RCTPromiseRejectBlock) {
    resolve("Slow render simulation started")
    
    // Schedule repeated main thread blocks to generate multiple slow frames
    for i in 0..<repeatCount {
      DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * repeatIntervalSeconds + 0.001) { [weak self] in
        guard let self = self else { return }

        print("Sleeping for \(self.slowRenderSleepSeconds)s to force slow frames (\(i + 1)/\(self.repeatCount))")
        Thread.sleep(forTimeInterval: self.slowRenderSleepSeconds)
      }
    }
  }
  
  /// Simulates frozen frames by blocking the main thread for 2 seconds multiple times.
  @objc
  func simulateFrozenRender(_ resolve: @escaping RCTPromiseResolveBlock,
                            reject: @escaping RCTPromiseRejectBlock) {
    resolve("Frozen render simulation started")
    
    // Schedule repeated main thread blocks to generate multiple frozen frames
    for i in 0..<repeatCount {
      DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 3.0 + 0.001) { [weak self] in
        guard let self = self else { return }

        print("Sleeping for \(self.frozenRenderSleepSeconds)s to force frozen frames (\(i + 1)/\(self.repeatCount))")
        Thread.sleep(forTimeInterval: self.frozenRenderSleepSeconds)
      }
    }
  }
  
  // MARK: - Network Testing
  
  @objc
  func testOkHttpGet(_ url: String?,
                     resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {
    reject("PLATFORM_ERROR", "OkHttp is only available on Android", nil)
  }
  
  @objc
  func testHttpUrlConnectionGet(_ url: String?,
                                resolve: @escaping RCTPromiseResolveBlock,
                                reject: @escaping RCTPromiseRejectBlock) {
    reject("PLATFORM_ERROR", "HttpURLConnection is only available on Android", nil)
  }
  
  @objc
  func testURLSessionGet(_ url: String?,
                         resolve: @escaping RCTPromiseResolveBlock,
                         reject: @escaping RCTPromiseRejectBlock) {
    let targetUrl = url ?? "https://httpbin.org/get"
    
    guard let requestUrl = URL(string: targetUrl) else {
      reject("INVALID_URL", "Invalid URL: \(targetUrl)", nil)
      return
    }
    
    var request = URLRequest(url: requestUrl)
    request.httpMethod = "GET"
    request.addValue("application/json", forHTTPHeaderField: "Accept")
    request.addValue("SplunkRNTestApp/1.0 (iOS)", forHTTPHeaderField: "User-Agent")
    
    let task = URLSession.shared.dataTask(with: request) { data, response, error in
      if let error = error {
        DispatchQueue.main.async {
          reject("NETWORK_ERROR", error.localizedDescription, error)
        }
        return
      }
      
      let statusCode = (response as? HTTPURLResponse)?.statusCode ?? -1
      let message = "URLSession request completed with status: \(statusCode)"
      
      DispatchQueue.main.async {
        resolve(message)
      }
    }
    
    task.resume()
  }
}
