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

package com.splunk.otel.reactnative.sessionreplay

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.splunk.rum.integration.sessionreplay.api.SessionReplay

class SplunkSessionReplayImplementation {

  companion object {
    private const val TAG = "SplunkSessionReplay"
  }

  // MARK: - Recording Control

  fun start(promise: Promise) {
    try {
      SessionReplay.instance.start()
      Log.d(TAG, "start() - recording started")
      promise.resolve(null)
    } catch (t: Throwable) {
      Log.e(TAG, "start() - failed", t)
      promise.reject("E_SESSION_REPLAY_START", t)
    }
  }

  fun stop(promise: Promise) {
    try {
      SessionReplay.instance.stop()
      Log.d(TAG, "stop() - recording stopped")
      promise.resolve(null)
    } catch (t: Throwable) {
      Log.e(TAG, "stop() - failed", t)
      promise.reject("E_SESSION_REPLAY_STOP", t)
    }
  }

  // MARK: - State

  fun getState(promise: Promise) {
    try {
      val state = SessionReplay.instance.state
      promise.resolve(SessionReplaySerializer.serializeState(state))
    } catch (t: Throwable) {
      Log.e(TAG, "getState() - failed", t)
      promise.reject("E_SESSION_REPLAY_STATE", t)
    }
  }

  // MARK: - Preferences

  fun getPreferences(promise: Promise) {
    try {
      val mode = SessionReplay.instance.preferences.renderingMode
      promise.resolve(SessionReplaySerializer.serializePreferences(mode))
    } catch (t: Throwable) {
      Log.e(TAG, "getPreferences() - failed", t)
      promise.reject("E_SESSION_REPLAY_PREFS", t)
    }
  }

  fun setPreferences(renderingMode: String?, promise: Promise) {
    try {
      SessionReplay.instance.preferences.renderingMode =
        SessionReplaySerializer.deserializeRenderingMode(renderingMode)
      promise.resolve(null)
    } catch (t: Throwable) {
      Log.e(TAG, "setPreferences() - failed", t)
      promise.reject("E_SESSION_REPLAY_PREFS", t)
    }
  }

  // MARK: - Recording Mask

  fun getRecordingMask(promise: Promise) {
    try {
      val mask = SessionReplay.instance.recordingMask
      if (mask != null) {
        promise.resolve(SessionReplaySerializer.serializeRecordingMask(mask))
      } else {
        promise.resolve(null)
      }
    } catch (t: Throwable) {
      Log.e(TAG, "getRecordingMask() - failed", t)
      promise.reject("E_SESSION_REPLAY_MASK", t)
    }
  }

  fun setRecordingMask(mask: ReadableMap?, promise: Promise) {
    try {
      SessionReplay.instance.recordingMask =
        SessionReplaySerializer.deserializeRecordingMask(mask)
      promise.resolve(null)
    } catch (t: Throwable) {
      Log.e(TAG, "setRecordingMask() - failed", t)
      promise.reject("E_SESSION_REPLAY_MASK", t)
    }
  }
}
