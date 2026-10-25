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

/// Lifecycle evidence observed before the native agent is installed.
///
/// The recorder captures facts only. The native AppStart module validates the
/// handed-off snapshot and decides whether it becomes a cold, warm or no span.
///
/// Only the first activation is described. A foreground boundary is kept only
/// when it is paired with that activation, so it is cleared by a background
/// transition and ignored once the app has become active.
struct AppStartLifecycleRecorder {

  // MARK: - Types

  enum LaunchOrigin: Equatable {
    case foreground
    case background
    case foregroundResumed
    case unknown
  }

  struct Snapshot: Equatable {
    let launchOrigin: LaunchOrigin
    let didFinishLaunching: Date?
    let willEnterForeground: Date?
    let didBecomeActive: Date?
  }

  // MARK: - State

  private var launchOrigin: LaunchOrigin = .unknown
  private var didFinishLaunching: Date?
  private var willEnterForeground: Date?
  private var didBecomeActive: Date?
  private var hasConflictingBoundary = false
  private var hasHandedOff = false

  // MARK: - Recording

  /// Records the launch with the origin derived from the application state at
  /// `didFinishLaunching`: `.foreground`, `.background`, or `.unknown`.
  mutating func recordDidFinishLaunching(at timestamp: Date, origin: LaunchOrigin) {
    guard !hasHandedOff, didFinishLaunching == nil else {
      return
    }

    didFinishLaunching = timestamp
    launchOrigin = origin
  }

  mutating func recordWillEnterForeground(at timestamp: Date) {
    guard !hasHandedOff, didBecomeActive == nil else {
      return
    }

    // UIKit never posts two boundaries for one activation.
    if willEnterForeground != nil {
      hasConflictingBoundary = true
    }

    willEnterForeground = timestamp
  }

  mutating func recordDidBecomeActive(at timestamp: Date) {
    guard !hasHandedOff, didBecomeActive == nil else {
      return
    }

    didBecomeActive = timestamp
  }

  mutating func recordDidEnterBackground() {
    guard !hasHandedOff, didBecomeActive == nil else {
      return
    }

    if launchOrigin == .foreground {
      launchOrigin = .foregroundResumed
    }

    willEnterForeground = nil
  }

  // MARK: - Handoff

  /// Returns the evidence on the first call and `nil` afterwards. Recording
  /// stops once the evidence has been handed off.
  mutating func handOff() -> Snapshot? {
    guard !hasHandedOff else {
      return nil
    }

    hasHandedOff = true

    return Snapshot(
      launchOrigin: hasConflictingBoundary ? .unknown : launchOrigin,
      didFinishLaunching: didFinishLaunching,
      willEnterForeground: willEnterForeground,
      didBecomeActive: didBecomeActive
    )
  }
}
