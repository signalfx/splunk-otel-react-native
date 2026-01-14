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
import UIKit
@_spi(SplunkInternal) import SplunkAgent

/// Handles the late app start measurement for React Native. 
@objcMembers
@objc(AppStartHandler)
public final class AppStartHandler: NSObject {

  // MARK: - Singleton

  public static let shared: AppStartHandler = {
    let handler = AppStartHandler()
    return handler
  }()

  /// Helper method to ensure the singleton is initialized.
  @objc public static func setUp() {
    _ = shared
  }

  // MARK: - Lifecycle timestamps

  private var didFinishLaunchingAt: Date?
  private var willEnterForegroundAt: Date?
  private var didBecomeActiveAt: Date?

  // MARK: - State

  private var hasTrackedAppStart = false
  private var notificationObservers: [NSObjectProtocol] = []

  // MARK: - Initialization

  private override init() {
    super.init()
    startObservingLifecycleNotifications()
  }

  deinit {
    stopObservingLifecycleNotifications()
  }

  // MARK: - Notification Observers

  private func startObservingLifecycleNotifications() {
    // Observe didFinishLaunching - marks cold start path
    let didFinishLaunchingObserver = NotificationCenter.default.addObserver(
      forName: UIApplication.didFinishLaunchingNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      self?.handleDidFinishLaunching()
    }

    notificationObservers.append(didFinishLaunchingObserver)

    // Observe willEnterForeground - marks warm/hot start path
    let willEnterForegroundObserver = NotificationCenter.default.addObserver(
      forName: UIApplication.willEnterForegroundNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      self?.handleWillEnterForeground()
    }

    notificationObservers.append(willEnterForegroundObserver)

    // Observe didBecomeActive - common endpoint for both cold and warm starts
    let didBecomeActiveObserver = NotificationCenter.default.addObserver(
      forName: UIApplication.didBecomeActiveNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      self?.handleDidBecomeActive()
    }

    notificationObservers.append(didBecomeActiveObserver)
  }

  private func stopObservingLifecycleNotifications() {
    for observer in notificationObservers {
      NotificationCenter.default.removeObserver(observer)
    }

    notificationObservers.removeAll()
  }

  // MARK: - Notification Handlers

  private func handleDidFinishLaunching() {
    if didFinishLaunchingAt == nil {
      didFinishLaunchingAt = Date()
    }
  }

  private func handleWillEnterForeground() {
    willEnterForegroundAt = Date()
  }

  private func handleDidBecomeActive() {
    didBecomeActiveAt = Date()
  }

  // MARK: - App Start Tracking

  /// Tracks app start timing using the native SDK API.
  public func trackAppStart() {
    guard !hasTrackedAppStart else {
      return
    }

    let becameActiveAt = didBecomeActiveAt ?? Date()

    SplunkRum.shared.appStart.track(
      didBecomeActive: becameActiveAt,
      didFinishLaunching: didFinishLaunchingAt,
      willEnterForeground: willEnterForegroundAt
    )

    hasTrackedAppStart = true

    // Cleanup for native SDK.
    willEnterForegroundAt = nil
  }

  /// Resets the handler state. Primarily for testing purposes.
  public func reset() {
    didFinishLaunchingAt = nil
    willEnterForegroundAt = nil
    didBecomeActiveAt = nil
    hasTrackedAppStart = false
  }
}
