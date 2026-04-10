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

import Native from './specs/NativeSplunkSessionReplay';
import type { SessionReplayState } from './model/SessionReplayState';
import type { SessionReplayPreferences } from './model/SessionReplayPreferences';
import type { RecordingMask } from './model/RecordingMask';
import {
  fromNativeState,
  fromNativePreferences,
  fromNativeRecordingMask,
  toNativeRenderingMode,
  toNativeRecordingMask,
} from './bridge/converters';

/**
 * Session Replay singleton API.
 *
 * Provides control over session replay recording, including
 * start/stop, state inspection, preferences, and recording masks.
 *
 * Requires `@splunk/otel-react-native` to be installed first via
 * {@link SplunkRum.install} with a
 * {@link SessionReplayModuleConfiguration} in the modules array.
 *
 * @example
 * ```typescript
 * import { SplunkSessionReplay } from '@splunk/otel-session-replay-react-native';
 *
 * await SplunkSessionReplay.instance.start();
 *
 * const state = await SplunkSessionReplay.instance.getState();
 * console.log(state.status, state.isRecording);
 *
 * await SplunkSessionReplay.instance.stop();
 * ```
 */
export class SplunkSessionReplay {
  private static _instance: SplunkSessionReplay | null = null;

  private constructor() {}

  static get instance(): SplunkSessionReplay {
    if (!this._instance) this._instance = new SplunkSessionReplay();
    return this._instance;
  }

  /**
   * Starts session replay recording.
   *
   * If the SDK is not yet installed or session replay was not configured
   * during install, this is a no-op on the native side.
   */
  start(): Promise<void> {
    return Native.start();
  }

  /**
   * Stops the current session replay recording.
   */
  stop(): Promise<void> {
    return Native.stop();
  }

  /**
   * Returns a snapshot of the current session replay state.
   *
   * The state includes the recording status, effective rendering mode,
   * and the sampling rate applied at install time.
   */
  async getState(): Promise<SessionReplayState> {
    const native = await Native.getState();
    return fromNativeState(native);
  }

  /**
   * Returns the current session replay preferences.
   */
  async getPreferences(): Promise<SessionReplayPreferences> {
    const native = await Native.getPreferences();
    return fromNativePreferences(native);
  }

  /**
   * Updates session replay preferences.
   *
   * Pass `undefined` for {@link SessionReplayPreferences.renderingMode}
   * to clear the preference and fall back to the default.
   */
  setPreferences(preferences: SessionReplayPreferences): Promise<void> {
    return Native.setPreferences(
      toNativeRenderingMode(preferences.renderingMode)
    );
  }

  /**
   * Returns the current recording mask, or `null` if none is set.
   */
  async getRecordingMask(): Promise<RecordingMask | null> {
    const native = await Native.getRecordingMask();
    return fromNativeRecordingMask(native);
  }

  /**
   * Sets or clears the recording mask.
   *
   * Pass `null` to remove any previously set mask.
   *
   * @param mask - The recording mask to apply, or `null` to clear.
   */
  setRecordingMask(mask: RecordingMask | null): Promise<void> {
    return Native.setRecordingMask(toNativeRecordingMask(mask));
  }
}
