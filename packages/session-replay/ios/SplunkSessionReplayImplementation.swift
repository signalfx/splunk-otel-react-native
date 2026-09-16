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
import UIKit

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

  // MARK: - Preferences

  @objc
  public func setRenderingMode(mode: NSString,
                               resolve: @escaping RCTPromiseResolveBlock,
                               reject: @escaping RCTPromiseRejectBlock) {
    guard let renderingMode = SessionReplaySerializer.deserializeRenderingMode(mode as String) else {
      reject("E_SESSION_REPLAY_RENDERING_MODE",
             "'\(mode)' is not a known rendering mode",
             nil)
      return
    }

    onMainThread {
      // The fluent setter is non-mutating, so it works through the get-only
      // `preferences` existential. Its `didSet` propagates to the SDK.
      SplunkRum.shared.sessionReplay.preferences.renderingMode(renderingMode)
      resolve(nil)
    }
  }

  // MARK: - Host Component Support

  /// Applies sensitivity directly to a view, for the `SplunkSensitiveView` host
  /// component.
  ///
  /// The component owns its view, so it can set the flag on creation and clear
  /// it on recycle without resolving a React tag. `nil` removes the override.
  @objc
  public static func applySensitivity(for view: UIView, isSensitive: NSNumber?) {
    let value = isSensitive?.boolValue

    // Fabric mounts on the main thread, so this is normally already correct.
    if Thread.isMainThread {
      SplunkRum.shared.sessionReplay.sensitivity[view] = value
    } else {
      DispatchQueue.main.async {
        SplunkRum.shared.sessionReplay.sensitivity[view] = value
      }
    }
  }

  // MARK: - Instance Sensitivity

  @objc
  public func setViewSensitivity(reactTag: NSNumber,
                                 isSensitive: Bool,
                                 resolve: @escaping RCTPromiseResolveBlock,
                                 reject: @escaping RCTPromiseRejectBlock) {
    applyViewSensitivity(reactTag: reactTag, isSensitive: isSensitive, resolve: resolve)
  }

  @objc
  public func clearViewSensitivity(reactTag: NSNumber,
                                   resolve: @escaping RCTPromiseResolveBlock,
                                   reject: @escaping RCTPromiseRejectBlock) {
    applyViewSensitivity(reactTag: reactTag, isSensitive: nil, resolve: resolve)
  }

  /// Resolves a React tag to its `UIView` and applies `isSensitive` to it.
  ///
  /// A `nil` value removes the instance override so the class-level default
  /// applies again.
  @nonobjc
  private func applyViewSensitivity(reactTag: NSNumber,
                                    isSensitive: Bool?,
                                    resolve: @escaping RCTPromiseResolveBlock) {
    onMainThread {
      guard let view = Self.findView(withReactTag: reactTag.intValue) else {
        // The view may not be mounted yet, or may have been unmounted between
        // the JS call and this block. Report it rather than failing.
        resolve(false)
        return
      }

      SplunkRum.shared.sessionReplay.sensitivity[view] = isSensitive
      resolve(true)
    }
  }

  /// Locates a mounted view by React tag.
  ///
  /// Fabric assigns the React tag to `UIView.tag` when a component view is
  /// taken from the recycle pool, so a hierarchy search finds it without
  /// depending on the bridge - which no longer exists in bridgeless mode.
  private static func findView(withReactTag reactTag: Int) -> UIView? {
    guard reactTag != 0 else { return nil }

    for scene in UIApplication.shared.connectedScenes {
      guard let windowScene = scene as? UIWindowScene else { continue }
      for window in windowScene.windows {
        if let view = window.viewWithTag(reactTag) {
          return view
        }
      }
    }

    return nil
  }

  // MARK: - Class Sensitivity

  @objc
  public func setClassSensitivity(className: NSString,
                                  isSensitive: Bool,
                                  resolve: @escaping RCTPromiseResolveBlock,
                                  reject: @escaping RCTPromiseRejectBlock) {
    applyClassSensitivity(className: className, isSensitive: isSensitive, resolve: resolve, reject: reject)
  }

  @objc
  public func clearClassSensitivity(className: NSString,
                                    resolve: @escaping RCTPromiseResolveBlock,
                                    reject: @escaping RCTPromiseRejectBlock) {
    applyClassSensitivity(className: className, isSensitive: nil, resolve: resolve, reject: reject)
  }

  @nonobjc
  private func applyClassSensitivity(className: NSString,
                                     isSensitive: Bool?,
                                     resolve: @escaping RCTPromiseResolveBlock,
                                     reject: @escaping RCTPromiseRejectBlock) {
    guard let viewClass = Self.lookUpViewClass(className) else {
      reject("E_SESSION_REPLAY_UNKNOWN_CLASS",
             "'\(className)' is not a loadable UIView subclass",
             nil)
      return
    }

    onMainThread {
      SplunkRum.shared.sessionReplay.sensitivity[viewClass] = isSensitive
      resolve(nil)
    }
  }

  @objc
  public func getClassSensitivity(className: NSString,
                                  resolve: @escaping RCTPromiseResolveBlock,
                                  reject: @escaping RCTPromiseRejectBlock) {
    guard let viewClass = Self.lookUpViewClass(className) else {
      reject("E_SESSION_REPLAY_UNKNOWN_CLASS",
             "'\(className)' is not a loadable UIView subclass",
             nil)
      return
    }

    onMainThread {
      let value = SplunkRum.shared.sessionReplay.sensitivity[viewClass]
      resolve(SessionReplaySerializer.serializeSensitivity(value))
    }
  }

  private static func lookUpViewClass(_ className: NSString) -> UIView.Type? {
    guard let anyClass = NSClassFromString(className as String) else { return nil }
    return anyClass as? UIView.Type
  }

  // MARK: - Helpers

  private func onMainThread(_ block: @escaping () -> Void) {
    if Thread.isMainThread { block() } else { DispatchQueue.main.async(execute: block) }
  }
}
