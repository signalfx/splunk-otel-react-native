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
import com.splunk.rum.integration.sessionreplay.api.SessionReplay

class SplunkSessionReplayImplementation {

  companion object {
    private const val TAG = "SplunkSessionReplay"
  }

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
}
