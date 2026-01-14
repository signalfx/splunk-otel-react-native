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
import SplunkAgent

/// Builds native AgentConfiguration from the TS API.
enum AgentConfigurationBuilder {

  static func build(from dict: NSDictionary) throws -> AgentConfiguration {
    guard let endpointAny = dict.object(forKey: "endpoint"), !(endpointAny is NSNull) else {
      throw NSError(domain: "splunk.rn", code: 1, userInfo: [NSLocalizedDescriptionKey: "Missing endpoint in configuration"])
    }
    let endpoint = try buildEndpoint(from: endpointAny as? NSDictionary ?? NSDictionary())

    guard let appName = dict.object(forKey: "appName") as? String,
          let env = dict.object(forKey: "deploymentEnvironment") as? String else {
      throw NSError(domain: "splunk.rn", code: 1, userInfo: [NSLocalizedDescriptionKey: "Missing appName or deploymentEnvironment"])
    }

    var config = AgentConfiguration(endpoint: endpoint, appName: appName, deploymentEnvironment: env)
    if let appVersion = dict.object(forKey: "appVersion") as? String {
      config.appVersion = appVersion
    }

    if let debug = dict.object(forKey: "enableDebugLogging") as? Bool {
      config.enableDebugLogging = debug
    }

    if let global = dict.object(forKey: "globalAttributes") as? NSDictionary {
      config.globalAttributes = AttributeConverter.buildAttributes(from: global)
    }

    if let user = dict.object(forKey: "user") as? NSDictionary {
      var u = UserConfiguration()
      if let modeStr = user.object(forKey: "trackingMode") as? String {
        u.trackingMode = UserSessionHandler.deserializeUserTrackingMode(modeStr)
      }

      config.user = u
    }

    if let session = dict.object(forKey: "session") as? NSDictionary {
      var s = SessionConfiguration()

      if let samplingRate = session.object(forKey: "samplingRate") as? NSNumber {
        s.samplingRate = samplingRate.doubleValue
      } else if let samplingRate = session.object(forKey: "samplingRate") as? Double {
        s.samplingRate = samplingRate
      }

      config.session = s
    }

    return config
  }

  static func buildEndpoint(from dict: NSDictionary) throws -> EndpointConfiguration {
    if let realm = dict.object(forKey: "realm") as? String,
       let token = dict.object(forKey: "rumAccessToken") as? String {
      return EndpointConfiguration(realm: realm, rumAccessToken: token)
    }

    let tracesStr = dict.object(forKey: "trace") as? String
    let srStr = dict.object(forKey: "sessionReplay") as? String

    guard let tracesStr, let tracesURL = URL(string: tracesStr) else {
      throw NSError(domain: "splunk.rn", code: 2, userInfo: [NSLocalizedDescriptionKey: "Invalid trace"])
    }

    let srURL = srStr.flatMap { URL(string: $0) }
    return EndpointConfiguration(trace: tracesURL, sessionReplay: srURL)
  }
}
