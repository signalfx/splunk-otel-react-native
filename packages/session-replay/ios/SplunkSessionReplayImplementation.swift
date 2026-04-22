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

@objcMembers
@objc(SplunkSessionReplayImplementation)
public class SplunkSessionReplayImplementation: NSObject {

  // MARK: - Recording Control

  @objc
  public func start(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    onMainThread {
      SplunkRum.shared.sessionReplay.start()
      resolve(nil)
    }
  }

  @objc
  public func stop(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    onMainThread {
      SplunkRum.shared.sessionReplay.stop()
      resolve(nil)
    }
  }

  // MARK: - State

  @objc
  public func getState(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    onMainThread {
      let state = SplunkRum.shared.sessionReplay.state
      resolve(SessionReplaySerializer.serializeState(state))
    }
  }

  // MARK: - Recording Mask

  @objc
  public func getRecordingMask(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    onMainThread {
      guard let mask = SplunkRum.shared.sessionReplay.recordingMask else {
        resolve(nil)
        return
      }
      resolve(SessionReplaySerializer.serializeRecordingMask(mask))
    }
  }

  @objc
  public func setRecordingMask(mask: NSDictionary?,
                               resolve: @escaping RCTPromiseResolveBlock,
                               reject: @escaping RCTPromiseRejectBlock) {
    let deserialized: RecordingMask?
    if let maskDict = mask {
      deserialized = SessionReplaySerializer.deserializeRecordingMask(maskDict)
    } else {
      deserialized = nil
    }

    onMainThread {
      SplunkRum.shared.sessionReplay.recordingMask = deserialized
      resolve(nil)
    }
  }

  // MARK: - Helpers

  private func onMainThread(_ block: @escaping () -> Void) {
    if Thread.isMainThread { block() } else { DispatchQueue.main.async(execute: block) }
  }
}
