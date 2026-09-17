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
  ///
  /// A view can mount before the agent is installed - `SplunkRumProvider`
  /// renders its children synchronously and installs from an effect - and in
  /// that state the sensitivity API is a proxy whose setter silently does
  /// nothing. Since React Native does not re-apply an unchanged prop, the
  /// request is retained and retried until it takes effect, so sensitive
  /// content does not stay visible for the lifetime of the view.
  @objc
  public static func applySensitivity(for view: UIView, isSensitive: NSNumber?) {
    onMain {
      applyRetainingSensitivity(for: view, isSensitive: isSensitive?.boolValue, attempt: 0)
    }
  }

  @nonobjc
  private static func applyRetainingSensitivity(for view: UIView,
                                                isSensitive: Bool?,
                                                attempt: Int) {
    let sensitivity = SplunkRum.shared.sessionReplay.sensitivity
    sensitivity[view] = isSensitive

    // Clearing cannot be verified this way, and clearing against a
    // non-operational proxy is a no-op either way, so only a request to mask
    // or exempt is worth retrying.
    guard let isSensitive else { return }

    // The non-operational proxy's getter always reports nil, so a read-back
    // that does not match means the write never landed.
    if sensitivity[view] == isSensitive { return }

    guard attempt < sensitivityRetryLimit else {
      debugPrint("SplunkSessionReplay: sensitivity could not be applied; session replay is unavailable.")
      return
    }

    DispatchQueue.main.asyncAfter(deadline: .now() + sensitivityRetryDelay) { [weak view] in
      guard let view else { return }
      applyRetainingSensitivity(for: view, isSensitive: isSensitive, attempt: attempt + 1)
    }
  }

  /// Roughly ten seconds, which comfortably covers agent installation.
  private static let sensitivityRetryLimit = 40
  private static let sensitivityRetryDelay: TimeInterval = 0.25

  private static func onMain(_ block: @escaping () -> Void) {
    if Thread.isMainThread { block() } else { DispatchQueue.main.async(execute: block) }
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
  /// Searched by hand rather than with `viewWithTag:` because the two React
  /// Native architectures store the tag differently. Fabric assigns it to
  /// `UIView.tag` when a component view leaves the recycle pool, while the
  /// legacy architecture keeps it in an associated object behind the
  /// `reactTag` category property and leaves `UIView.tag` untouched - so
  /// `viewWithTag:` would never find a legacy view.
  ///
  /// This avoids depending on the bridge, which does not exist in bridgeless
  /// mode.
  private static func findView(withReactTag reactTag: Int) -> UIView? {
    guard reactTag != 0 else { return nil }

    for scene in UIApplication.shared.connectedScenes {
      guard let windowScene = scene as? UIWindowScene else { continue }
      for window in windowScene.windows {
        if let view = findView(withReactTag: reactTag, in: window) {
          return view
        }
      }
    }

    return nil
  }

  private static func findView(withReactTag reactTag: Int, in view: UIView) -> UIView? {
    if matches(view: view, reactTag: reactTag) {
      return view
    }

    for subview in view.subviews {
      if let match = findView(withReactTag: reactTag, in: subview) {
        return match
      }
    }

    return nil
  }

  private static let reactTagSelector = NSSelectorFromString("reactTag")

  private static func matches(view: UIView, reactTag: Int) -> Bool {
    if view.tag == reactTag {
      return true
    }

    guard view.responds(to: reactTagSelector),
          let legacyTag = view.value(forKey: "reactTag") as? NSNumber
    else {
      return false
    }

    return legacyTag.intValue == reactTag
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
