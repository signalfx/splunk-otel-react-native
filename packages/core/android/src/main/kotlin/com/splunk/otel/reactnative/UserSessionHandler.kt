/*
 * Copyright 2025 Splunk Inc.
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

package com.splunk.otel.reactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableNativeMap
import com.splunk.rum.integration.agent.api.SplunkRum
import com.splunk.rum.integration.agent.api.user.UserTrackingMode

/**
 * Handles user and session state operations.
 */
class UserSessionHandler {

  fun getState(promise: Promise) {
    try {
      val state = SplunkRum.instance.state
      promise.resolve(StateSerializer.serializeAgentState(state))
    } catch (t: Throwable) {
      promise.reject("E_STATE", t)
    }
  }

  fun getSessionState(promise: Promise) {
    try {
      val s = SplunkRum.instance.session.state
      val m = WritableNativeMap()

      m.putString("id", s.id)
      m.putDouble("samplingRate", s.samplingRate)

      promise.resolve(m)
    } catch (t: Throwable) {
      promise.reject("E_SESSION_STATE", t)
    }
  }

  fun getUserState(promise: Promise) {
    try {
      val u = SplunkRum.instance.user.state
      val m = WritableNativeMap()
      m.putString("trackingMode", u.trackingMode.name)

      promise.resolve(m)
    } catch (t: Throwable) {
      promise.reject("E_USER_STATE", t)
    }
  }

  fun setUserTrackingMode(mode: String?, promise: Promise) {
    try {
      val m = mode?.let { UserTrackingMode.valueOf(it) }
      SplunkRum.instance.user.preferences.trackingMode = m

      promise.resolve(null)
    } catch (t: Throwable) {
      promise.reject("E_USER_PREF", t)
    }
  }
}
