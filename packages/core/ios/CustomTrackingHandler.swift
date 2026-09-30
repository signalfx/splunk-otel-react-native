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
import OpenTelemetryApi
import React
import SplunkAgent

/// Handles custom tracking operations.
@objcMembers
@objc(CustomTrackingHandler)
public class CustomTrackingHandler: NSObject {

  public func trackEvent(_ name: NSString,
                         attributes: NSDictionary,
                         resolve: @escaping RCTPromiseResolveBlock,
                         reject: @escaping RCTPromiseRejectBlock) {
    let attrs = AttributeConverter.buildAttributes(from: attributes)
    _ = SplunkRum.shared.customTracking.trackCustomEvent(name as String, attrs)
    resolve(nil)
  }

  /// Synchronously persists a fatal React Native crash through the iOS agent.
  public func recordFatalCrashSync(_ message: NSString,
                                   stack: NSString?,
                                   attributes: NSDictionary) -> Bool {
    let attrs = AttributeConverter.buildAttributes(from: attributes)
    return SplunkRum.shared.recordReactNativeFatalCrashSync(
      message: message as String,
      stacktrace: stack as String?,
      attributes: attrs
    )
  }

  public func startWorkflow(_ name: NSString,
                            resolve: @escaping RCTPromiseResolveBlock,
                            reject: @escaping RCTPromiseRejectBlock) {
    let span = SplunkRum.shared.customTracking.trackWorkflow(name as String)
    let handle = WorkflowSpanStore.shared.allocate(for: span)
    resolve(NSNumber(value: handle))
  }

  public func endWorkflow(_ handle: NSNumber,
                          resolve: @escaping RCTPromiseResolveBlock,
                          reject: @escaping RCTPromiseRejectBlock) {
    let span = WorkflowSpanStore.shared.remove(handle.intValue)
    span?.end()
    resolve(nil)
  }

  /// Attribute key marking the cross-platform layer the error originates from,
  /// used by the backend for symbolication and UI routing.
  private static let platformAttributeKey = "splunk.rum.platform"
  private static let platformAttributeValue = "react-native"

  /// Reports a caught JS error as a `component=error` span with an explicit,
  /// pre-formatted stacktrace.
  ///
  /// Routes to the native explicit-stack API
  /// (`customTracking.trackError(typeName:message:stacktrace:attributes:)`),
  /// which sets `exception.type`, `exception.message`, `exception.stacktrace`,
  /// `error=true`, and `component=error` without re-deriving the stack from the
  /// native thread. Caller attributes are merged first; agent-managed keys win.
  ///
  public func reportError(_ type: NSString,
                          message: NSString,
                          stacktrace: NSString,
                          attributes: NSDictionary,
                          source: NSString,
                          handled: Bool,
                          resolve: @escaping RCTPromiseResolveBlock,
                          reject: @escaping RCTPromiseRejectBlock) {
    var merged: [String: Any] = (attributes as? [String: Any]) ?? [:]
    merged["error.source"] = source as String
    merged["exception.escaped"] = !handled
    merged[CustomTrackingHandler.platformAttributeKey] =
      CustomTrackingHandler.platformAttributeValue

    let stack = stacktrace as String
    _ = SplunkRum.shared.customTracking.trackError(
      typeName: type as String,
      message: message as String,
      stacktrace: stack.isEmpty ? nil : stack,
      attributes: merged
    )

    resolve(nil)
  }
}
