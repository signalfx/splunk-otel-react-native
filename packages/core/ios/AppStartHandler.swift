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
import SplunkAgent

/// Captures app lifecycle evidence before the agent is installed from JavaScript and
/// hands it to the native AppStart module, which classifies and emits the span.
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

  // MARK: - State

  // Notifications are recorded on the posting (main) thread, while the handoff
  // runs on the React Native module queue.
  private let lock = NSLock()
  private var recorder = AppStartLifecycleRecorder()
  private var notificationObservers: [NSObjectProtocol] = []

  // MARK: - Initialization

  private override init() {
    super.init()
    startObservingLifecycleNotifications()
  }

  deinit {
    for observer in notificationObservers {
      NotificationCenter.default.removeObserver(observer)
    }
  }

  // MARK: - Notification Observers

  private func startObservingLifecycleNotifications() {
    let observers = [
      observe(UIApplication.didFinishLaunchingNotification) { recorder, notification, timestamp in
        recorder.recordDidFinishLaunching(at: timestamp, origin: Self.launchOrigin(of: notification))
      },
      observe(UIApplication.willEnterForegroundNotification) { recorder, _, timestamp in
        recorder.recordWillEnterForeground(at: timestamp)
      },
      observe(UIApplication.didBecomeActiveNotification) { recorder, _, timestamp in
        recorder.recordDidBecomeActive(at: timestamp)
      },
      observe(UIApplication.didEnterBackgroundNotification) { recorder, _, _ in
        recorder.recordDidEnterBackground()
      }
    ]

    withLock { notificationObservers = observers }
  }

  private func observe(
    _ name: Notification.Name,
    record: @escaping (inout AppStartLifecycleRecorder, Notification, Date) -> Void
  ) -> NSObjectProtocol {
    // A nil queue runs the block synchronously on the posting thread, so the
    // timestamp and application state belong to the notification itself.
    NotificationCenter.default.addObserver(forName: name, object: nil, queue: nil) { [weak self] notification in
      let timestamp = Date()

      guard let self else {
        return
      }

      self.withLock { record(&self.recorder, notification, timestamp) }
    }
  }

  private static func launchOrigin(of notification: Notification) -> AppStartLifecycleRecorder.LaunchOrigin {
    guard Thread.isMainThread, let application = notification.object as? UIApplication else {
      return .unknown
    }

    switch application.applicationState {
    case .active, .inactive:
      return .foreground

    case .background:
      return .background

    @unknown default:
      return .unknown
    }
  }

  // MARK: - App Start Tracking

  /// Hands the captured lifecycle evidence to the native AppStart module.
  ///
  /// Call exactly once, immediately after `SplunkRum.install`. Later calls are ignored.
  public func trackAppStart() {
    let (snapshot, observers) = withLock { () -> (AppStartLifecycleRecorder.Snapshot?, [NSObjectProtocol]) in
      let observers = notificationObservers
      notificationObservers = []
      return (recorder.handOff(), observers)
    }

    guard let snapshot else {
      return
    }

    _ = SplunkRum.shared.appStart.track(initialLifecycle: AppStartLifecycleSnapshot(snapshot))

    for observer in observers {
      NotificationCenter.default.removeObserver(observer)
    }
  }

  private func withLock<Result>(_ work: () -> Result) -> Result {
    lock.lock()
    defer { lock.unlock() }
    return work()
  }
}

private extension AppStartLifecycleSnapshot {

  init(_ snapshot: AppStartLifecycleRecorder.Snapshot) {
    let launchOrigin: AppStartLaunchOrigin

    switch snapshot.launchOrigin {
    case .foreground:
      launchOrigin = .foreground

    case .background:
      launchOrigin = .background

    case .foregroundResumed:
      launchOrigin = .foregroundResumed

    case .unknown:
      launchOrigin = .unknown
    }

    self.init(
      launchOrigin: launchOrigin,
      didFinishLaunching: snapshot.didFinishLaunching,
      willEnterForeground: snapshot.willEnterForeground,
      didBecomeActive: snapshot.didBecomeActive
    )
  }
}
