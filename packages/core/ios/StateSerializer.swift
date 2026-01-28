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

/// Serializes agent state objects for TS types consumption.
enum StateSerializer {

  static func serializeAgentState(_ state: SplunkAgent.RuntimeState) -> [String: Any] {
    var statusDict: [String: Any]

    switch state.status {
    case .running:
      statusDict = ["type": "Running"]
    case .notRunning(let cause):
      let reason: String

      switch cause {
      case .notInstalled: reason = "NotInstalled"
      case .unsupportedPlatform: reason = "UnsupportedPlatform"
      case .sampledOut: reason = "SampledOut"
      }

      statusDict = ["type": "NotRunning", "reason": reason]
    }

    return [
      "appName": state.appName,
      "appVersion": state.appVersion,
      "deploymentEnvironment": state.deploymentEnvironment,
      "status": statusDict,
      "endpoint": serializeEndpoint(state.endpointConfiguration),
      "isDebugLoggingEnabled": state.isDebugLoggingEnabled,
      "instrumentedProcessName": NSNull(),
      "deferredUntilForeground": false
    ]
  }

  static func serializeEndpoint(_ ep: EndpointConfiguration) -> [String: Any] {
    if let realm = ep.realm, let token = ep.rumAccessToken {
      return ["realm": realm, "rumAccessToken": token]
    }

    var dict: [String: Any] = ["trace": ep.traceEndpoint?.absoluteString ?? ""]
    if let sr = ep.sessionReplayEndpoint {
      dict["sessionReplay"] = sr.absoluteString
    }

    return dict
  }
}
