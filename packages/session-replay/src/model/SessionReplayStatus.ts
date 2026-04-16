/*
 * Copyright 2026 Splunk Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Represents the current recording status of the session replay module.
 *
 * Some values are platform-specific. iOS may report
 * {@link SessionReplayStatus.NOT_RECORDING_SWIFT_UI_PREVIEW_CONTEXT}
 * while Android may report
 * {@link SessionReplayStatus.NOT_RECORDING_BELOW_MIN_SDK_VERSION}.
 */
export enum SessionReplayStatus {
  /** Session replay is actively recording. */
  RECORDING = 'recording',
  /** Recording has not been started yet. */
  NOT_RECORDING_NOT_STARTED = 'notStarted',
  /** Recording was explicitly stopped. */
  NOT_RECORDING_STOPPED = 'stopped',
  /** An internal error prevented recording. */
  NOT_RECORDING_INTERNAL_ERROR = 'internalError',
  /** The current platform is not supported. */
  NOT_RECORDING_UNSUPPORTED_PLATFORM = 'unsupportedPlatform',
  /** Device storage limit has been reached. */
  NOT_RECORDING_STORAGE_LIMIT_REACHED = 'storageLimitReached',
  /** Recording was disabled by the sampling rate configuration. */
  NOT_RECORDING_DISABLED_BY_SAMPLING = 'disabledBySampling',
  /** (iOS) SwiftUI preview context detected. */
  NOT_RECORDING_SWIFT_UI_PREVIEW_CONTEXT = 'swiftUIPreviewContext',
  /** (Android) Device OS version is below the minimum requirement. */
  NOT_RECORDING_BELOW_MIN_SDK_VERSION = 'belowMinSdkVersion',
}
