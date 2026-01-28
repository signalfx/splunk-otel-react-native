//
// Copyright 2025 Splunk Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

import Foundation
import React
import SplunkAgent

/// Handles user and session state operations.
@objcMembers
@objc(UserSessionHandler)
public class UserSessionHandler: NSObject {

  public func getState(_ resolve: @escaping RCTPromiseResolveBlock,
                       reject: @escaping RCTPromiseRejectBlock) {
    let state = SplunkRum.shared.state
    resolve(StateSerializer.serializeAgentState(state))
  }

  public func getSessionState(_ resolve: @escaping RCTPromiseResolveBlock,
                              reject: @escaping RCTPromiseRejectBlock) {
    let s = SplunkRum.shared.session.state
    resolve([
      "id": s.id,
      "samplingRate": s.samplingRate
    ])
  }

  public func getUserState(_ resolve: @escaping RCTPromiseResolveBlock,
                           reject: @escaping RCTPromiseRejectBlock) {
    let tracking = SplunkRum.shared.user.state.trackingMode
    resolve([
      "trackingMode": Self.serializeUserTrackingMode(tracking)
    ])
  }

  public func setUserTrackingMode(_ mode: NSString?,
                                  resolve: @escaping RCTPromiseResolveBlock,
                                  reject: @escaping RCTPromiseRejectBlock) {
    let m = Self.deserializeUserTrackingMode(mode as String?)
    SplunkRum.shared.user.preferences.trackingMode = m

    resolve(nil)
  }

  static func serializeUserTrackingMode(_ mode: UserTrackingMode) -> String {
    switch mode {
    case .noTracking: return "NO_TRACKING"
    case .anonymousTracking: return "ANONYMOUS_TRACKING"
    @unknown default: return "NO_TRACKING"
    }
  }

  static func deserializeUserTrackingMode(_ mode: String?) -> UserTrackingMode {
    switch mode {
    case "ANONYMOUS_TRACKING": return .anonymousTracking
    case "NO_TRACKING": fallthrough
    default: return .noTracking
    }
  }
}
