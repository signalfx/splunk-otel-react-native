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
import ObjectiveC
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
      // Recorded before the first attempt so that a later request - including
      // the clear issued when Fabric recycles the view - supersedes any retry
      // already in flight.
      setPendingSensitivity(isSensitive?.boolValue, for: view)
      applyPendingSensitivity(for: view, attempt: 0)
    }
  }

  /// Applies whatever sensitivity is currently pending for `view`.
  ///
  /// The desired value is read from the view on every attempt rather than
  /// captured, so a retry can never resurrect a value the component has since
  /// changed or released. Without that, a retry scheduled by one instance
  /// could land after Fabric reused the view and overwrite the new instance's
  /// setting - and a stale `false` would expose content the new instance asked
  /// to mask.
  /// - Parameter completion: Reports whether the value ended up in effect, so
  ///   the imperative bridge can settle its promise honestly instead of
  ///   claiming success for a write the proxy discarded.
  @nonobjc
  private static func applyPendingSensitivity(for view: UIView,
                                              attempt: Int,
                                              completion: ((Bool) -> Void)? = nil) {
    guard let pending = pendingSensitivity(for: view) else {
      // Superseded by a newer request, which owns its own outcome.
      completion?(true)
      return
    }

    let sensitivity = SplunkRum.shared.sessionReplay.sensitivity
    sensitivity[view] = pending.value

    // Clearing cannot be verified by reading back, and clearing against a
    // non-operational proxy is a no-op either way, so only a request to mask
    // or exempt is worth retrying.
    guard let desired = pending.value else {
      clearPendingSensitivity(for: view)
      completion?(true)
      return
    }

    // The non-operational proxy's getter always reports nil, so a read-back
    // that does not match means the write never landed.
    if sensitivity[view] == desired {
      clearPendingSensitivity(for: view)
      completion?(true)
      return
    }

    guard attempt < sensitivityRetryLimit else {
      clearPendingSensitivity(for: view)
      completion?(false)
      return
    }

    DispatchQueue.main.asyncAfter(deadline: .now() + sensitivityRetryDelay) { [weak view] in
      guard let view else {
        completion?(false)
        return
      }
      applyPendingSensitivity(for: view, attempt: attempt + 1, completion: completion)
    }
  }

  // MARK: - Pending Sensitivity Storage

  /// Boxed so that "no request pending" and "pending request to clear" stay
  /// distinguishable through the associated object.
  private final class PendingSensitivity {
    let value: Bool?
    init(_ value: Bool?) { self.value = value }
  }

  private static var pendingSensitivityKey: UInt8 = 0

  @nonobjc
  private static func setPendingSensitivity(_ value: Bool?, for view: UIView) {
    objc_setAssociatedObject(
      view,
      &pendingSensitivityKey,
      PendingSensitivity(value),
      .OBJC_ASSOCIATION_RETAIN_NONATOMIC
    )
  }

  @nonobjc
  private static func pendingSensitivity(for view: UIView) -> PendingSensitivity? {
    objc_getAssociatedObject(view, &pendingSensitivityKey) as? PendingSensitivity
  }

  @nonobjc
  private static func clearPendingSensitivity(for view: UIView) {
    objc_setAssociatedObject(
      view,
      &pendingSensitivityKey,
      nil,
      .OBJC_ASSOCIATION_RETAIN_NONATOMIC
    )
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
    applyViewSensitivity(reactTag: reactTag, isSensitive: isSensitive, resolve: resolve, reject: reject)
  }

  @objc
  public func clearViewSensitivity(reactTag: NSNumber,
                                   resolve: @escaping RCTPromiseResolveBlock,
                                   reject: @escaping RCTPromiseRejectBlock) {
    applyViewSensitivity(reactTag: reactTag, isSensitive: nil, resolve: resolve, reject: reject)
  }

  /// Resolves a React tag to its `UIView` and applies `isSensitive` to it.
  ///
  /// A `nil` value removes the instance override so the class-level default
  /// applies again.
  ///
  /// Retained and retried like the host-component path, because a caller can
  /// reach this before the agent finishes installing and the sensitivity proxy
  /// discards writes in that state. The promise settles on the real outcome
  /// rather than on having found a view.
  @nonobjc
  private func applyViewSensitivity(reactTag: NSNumber,
                                    isSensitive: Bool?,
                                    resolve: @escaping RCTPromiseResolveBlock,
                                    reject: @escaping RCTPromiseRejectBlock) {
    onMainThread {
      guard let view = Self.findView(withReactTag: reactTag.intValue) else {
        // The view may not be mounted yet, or may have been unmounted between
        // the JS call and this block. Report it rather than failing.
        resolve(false)
        return
      }

      Self.setPendingSensitivity(isSensitive, for: view)
      Self.applyPendingSensitivity(for: view, attempt: 0) { applied in
        if applied {
          resolve(true)
        } else {
          reject(Self.unavailableErrorCode, Self.unavailableErrorMessage, nil)
        }
      }
    }
  }

  private static let unavailableErrorCode = "E_SESSION_REPLAY_UNAVAILABLE"
  private static let unavailableErrorMessage =
    "Session replay did not become available, so the sensitivity request was not applied."

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
  private static let componentViewProtocol = NSProtocolFromString("RCTComponentViewProtocol")

  /// Whether `view` is the React view identified by `reactTag`.
  ///
  /// `UIView.tag` cannot be trusted on its own. Under the legacy architecture
  /// it is an ordinary application-controlled UIKit tag that React never
  /// touches, so any view that happens to have been given the same small
  /// integer would match first in a depth-first walk - applying sensitivity to
  /// the wrong view and leaving the intended content visible. Each
  /// architecture is therefore matched on the representation that is
  /// authoritative for it.
  private static func matches(view: UIView, reactTag: Int) -> Bool {
    // The legacy architecture stores the tag in an associated object behind
    // this category property, and Fabric never sets it. So when it is present
    // it is authoritative, and `UIView.tag` must not be consulted at all.
    if view.responds(to: reactTagSelector),
       let legacyTag = view.value(forKey: "reactTag") as? NSNumber {
      return legacyTag.intValue == reactTag
    }

    // Fabric assigns the React tag to `UIView.tag`, but only for views it
    // mounts, so require that this is actually a component view.
    guard let componentViewProtocol, view.conforms(to: componentViewProtocol) else {
      return false
    }

    return view.tag == reactTag
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

    let name = className as String

    onMainThread {
      // Recorded before the first attempt so a later request for the same
      // class supersedes any retry already in flight.
      Self.pendingClassSensitivity[name] = PendingSensitivity(isSensitive)
      Self.applyPendingClassSensitivity(
        viewClass: viewClass,
        className: name,
        attempt: 0,
        resolve: resolve,
        reject: reject
      )
    }
  }

  /// Applies whatever class sensitivity is currently pending for `className`.
  ///
  /// An app-wide policy can be requested before the agent finishes installing -
  /// a component inside `SplunkRumProvider` can call
  /// `maskAllText()` from a mount effect, and the provider renders its children
  /// before its install effect runs. In that state the sensitivity API is a
  /// proxy that discards writes, so resolving immediately would report success
  /// while the text stayed visible for the whole session. The request is
  /// retained and verified instead, and the promise settles only on the real
  /// outcome.
  @nonobjc
  private static func applyPendingClassSensitivity(viewClass: UIView.Type,
                                                   className: String,
                                                   attempt: Int,
                                                   resolve: @escaping RCTPromiseResolveBlock,
                                                   reject: @escaping RCTPromiseRejectBlock) {
    guard let pending = pendingClassSensitivity[className] else {
      // Superseded by a newer request, which owns its own outcome.
      resolve(nil)
      return
    }

    let sensitivity = SplunkRum.shared.sessionReplay.sensitivity
    sensitivity[viewClass] = pending.value

    // Clearing cannot be verified by reading back, and clearing against a
    // non-operational proxy is a no-op either way.
    guard let desired = pending.value else {
      pendingClassSensitivity[className] = nil
      resolve(nil)
      return
    }

    // The non-operational proxy's class getter always reports nil, so a
    // read-back that does not match means the write never landed.
    if sensitivity[viewClass] == desired {
      pendingClassSensitivity[className] = nil
      resolve(nil)
      return
    }

    guard attempt < sensitivityRetryLimit else {
      pendingClassSensitivity[className] = nil
      reject(unavailableErrorCode, unavailableErrorMessage, nil)
      return
    }

    DispatchQueue.main.asyncAfter(deadline: .now() + sensitivityRetryDelay) {
      applyPendingClassSensitivity(
        viewClass: viewClass,
        className: className,
        attempt: attempt + 1,
        resolve: resolve,
        reject: reject
      )
    }
  }

  /// Class policies requested but not yet in effect. Main-thread only.
  private static var pendingClassSensitivity: [String: PendingSensitivity] = [:]

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
