//
// Copyright 2026 Splunk Inc.
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
import React

@objc
public class SplunkSessionReplayImplementation: NSObject {

  @objc
  public func start(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let startClosure = {
      SplunkRum.shared.sessionReplay.start()
      resolve(nil)
    }

    if Thread.isMainThread { startClosure() } else { DispatchQueue.main.async(execute: startClosure) }
  }

  @objc
  public func stop(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let stopClosure = {
      SplunkRum.shared.sessionReplay.stop()
      resolve(nil)
    }

    if Thread.isMainThread { stopClosure() } else { DispatchQueue.main.async(execute: stopClosure) }
  }
}
