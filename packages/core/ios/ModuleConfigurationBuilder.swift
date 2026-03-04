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

#if canImport(SplunkNavigation)
import SplunkNavigation
#endif
#if canImport(SplunkInteractions)
import SplunkInteractions
#endif
#if canImport(SplunkNetworkMonitor)
import SplunkNetworkMonitor
#endif
#if canImport(SplunkSlowFrameDetector)
import SplunkSlowFrameDetector
#endif
#if canImport(SplunkNetwork)
import SplunkNetwork
#endif
#if canImport(SplunkCrashReports)
import SplunkCrashReports
#endif
#if canImport(SplunkSessionReplayProxy)
import SplunkSessionReplayProxy
#endif

/// Builds module configurations received from React Native.
enum ModuleConfigurationBuilder {

  static func build(from array: NSArray) -> [Any] {
    guard let items = array as? [[String: Any]] else { return [] }

    var result: [Any] = []
    for item in items {
      guard let name = item["name"] as? String,
            let attrs = item["attributes"] as? [String: String] else {
        continue
      }

      switch name {
      case "navigation":
        #if canImport(SplunkNavigation)
        let enabled = (attrs["enabled"] as NSString?)?.boolValue ?? true
        let autoTrack = (attrs["isAutomatedTrackingEnabled"] as NSString?)?.boolValue

        let conf = NavigationConfiguration(isEnabled: enabled, enableAutomatedTracking: autoTrack)
        result.append(conf)
        #endif
      case "interactions":
        #if canImport(SplunkInteractions)
        let enabled = (attrs["enabled"] as NSString?)?.boolValue ?? true

        let conf = InteractionsConfiguration(isEnabled: enabled)
        result.append(conf)
        #endif
      case "crash":
        #if canImport(SplunkCrashReports)
        let enabled = (attrs["enabled"] as NSString?)?.boolValue ?? true

        let conf = CrashReportsConfiguration(isEnabled: enabled)
        result.append(conf)
        #endif
      case "networkMonitor":
        #if canImport(SplunkNetworkMonitor)
        let enabled = (attrs["enabled"] as NSString?)?.boolValue ?? true

        let conf = NetworkMonitorConfiguration(isEnabled: enabled)
        result.append(conf)
        #endif
      case "slowrendering":
        #if canImport(SplunkSlowFrameDetector)
        let enabled = (attrs["enabled"] as NSString?)?.boolValue ?? true

        let conf = SlowFrameDetectorConfiguration(isEnabled: enabled)
        result.append(conf)
        #endif
      case "networkInstrumentation":
        #if canImport(SplunkNetwork)
        let enabled = (attrs["enabled"] as NSString?)?.boolValue ?? true
        var ignoreURLs: IgnoreURLs?
        if let pattern = attrs["ignoreURLs"], !pattern.isEmpty {
          ignoreURLs = IgnoreURLs(containing: try? NSRegularExpression(pattern: pattern))
        }

        let conf = NetworkInstrumentationConfiguration(isEnabled: enabled, ignoreURLs: ignoreURLs)
        result.append(conf)
        #endif
      case "sessionReplay":
        #if canImport(SplunkSessionReplayProxy)

        // tODO: this is a hack to get the session replay configuration auto-linked in the ppol
        // even tho it does not need the real configuration object. The proxy does not expose a public constructor - this is a native issue.
        let conf = unsafeBitCast((), to: SessionReplayConfiguration.self)
        result.append(conf)
        #endif
      default:
        // Ignore Android-only or unknown modules on iOS
        continue
      }
    }

    return result
  }
}
