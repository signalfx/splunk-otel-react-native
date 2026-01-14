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
}
