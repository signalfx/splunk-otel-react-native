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
import android.view.View
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.UIManagerHelper
import com.splunk.rum.integration.sessionreplay.api.SessionReplay

class SplunkSessionReplayImplementation(
  private val reactContext: ReactApplicationContext
) {

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

  // MARK: - Preferences

  fun setRenderingMode(mode: String, promise: Promise) {
    val renderingMode = SessionReplaySerializer.deserializeRenderingMode(mode)
    if (renderingMode == null) {
      promise.reject(
        "E_SESSION_REPLAY_RENDERING_MODE",
        "'$mode' is not a known rendering mode"
      )
      return
    }

    try {
      SessionReplay.instance.preferences.renderingMode = renderingMode
      promise.resolve(null)
    } catch (t: Throwable) {
      Log.e(TAG, "setRenderingMode() - failed", t)
      promise.reject("E_SESSION_REPLAY_RENDERING_MODE", t)
    }
  }

  // MARK: - Instance Sensitivity

  fun setViewSensitivity(reactTag: Double, isSensitive: Boolean, promise: Promise) {
    applyViewSensitivity(reactTag, isSensitive, promise)
  }

  fun clearViewSensitivity(reactTag: Double, promise: Promise) {
    applyViewSensitivity(reactTag, null, promise)
  }

  /**
   * Resolves a React tag to its native view and applies [isSensitive] to it.
   *
   * A `null` value removes the instance override so the class-level default
   * applies again.
   */
  private fun applyViewSensitivity(reactTag: Double, isSensitive: Boolean?, promise: Promise) {
    val tag = reactTag.toInt()

    // The session replay SDK stores instance sensitivity as a view tag and
    // requests a new frame, both of which must happen on the UI thread.
    UiThreadUtil.runOnUiThread {
      try {
        val view = resolveView(tag)
        if (view == null) {
          // Layout-only views are flattened out of the native tree, so there
          // is nothing to mark. Report it instead of failing, so callers can
          // surface the `collapsable={false}` requirement.
          Log.w(TAG, "setViewSensitivity() - no native view for tag $tag")
          promise.resolve(false)
          return@runOnUiThread
        }

        SessionReplay.instance.sensitivity.setViewInstanceSensitivity(view, isSensitive)
        promise.resolve(true)
      } catch (t: Throwable) {
        Log.e(TAG, "setViewSensitivity() - failed for tag $tag", t)
        promise.reject("E_SESSION_REPLAY_SENSITIVITY", t)
      }
    }
  }

  private fun resolveView(reactTag: Int): View? =
    UIManagerHelper.getUIManagerForReactTag(reactContext, reactTag)?.resolveView(reactTag)

  // MARK: - Class Sensitivity

  fun setClassSensitivity(className: String, isSensitive: Boolean, promise: Promise) {
    applyClassSensitivity(className, isSensitive, promise)
  }

  fun clearClassSensitivity(className: String, promise: Promise) {
    applyClassSensitivity(className, null, promise)
  }

  private fun applyClassSensitivity(className: String, isSensitive: Boolean?, promise: Promise) {
    val viewClass = lookUpViewClass(className)
    if (viewClass == null) {
      promise.reject(
        "E_SESSION_REPLAY_UNKNOWN_CLASS",
        "'$className' is not a loadable android.view.View subclass"
      )
      return
    }

    // The class sensitivity registry is an unsynchronized list that wireframe
    // extraction reads from the UI thread, so it must only be mutated there.
    UiThreadUtil.runOnUiThread {
      try {
        SessionReplay.instance.sensitivity.setViewClassSensitivity(viewClass, isSensitive)
        promise.resolve(null)
      } catch (t: Throwable) {
        Log.e(TAG, "setClassSensitivity() - failed for $className", t)
        promise.reject("E_SESSION_REPLAY_SENSITIVITY", t)
      }
    }
  }

  fun getClassSensitivity(className: String, promise: Promise) {
    val viewClass = lookUpViewClass(className)
    if (viewClass == null) {
      promise.reject(
        "E_SESSION_REPLAY_UNKNOWN_CLASS",
        "'$className' is not a loadable android.view.View subclass"
      )
      return
    }

    UiThreadUtil.runOnUiThread {
      try {
        val value = SessionReplay.instance.sensitivity.getViewClassSensitivity(viewClass)
        promise.resolve(SessionReplaySerializer.serializeSensitivity(value))
      } catch (t: Throwable) {
        Log.e(TAG, "getClassSensitivity() - failed for $className", t)
        promise.reject("E_SESSION_REPLAY_SENSITIVITY", t)
      }
    }
  }

  @Suppress("UNCHECKED_CAST")
  private fun lookUpViewClass(className: String): Class<View>? {
    val loaded = try {
      Class.forName(className, false, reactContext.classLoader)
    } catch (t: Throwable) {
      Log.w(TAG, "lookUpViewClass() - '$className' not found", t)
      return null
    }

    if (!View::class.java.isAssignableFrom(loaded)) {
      Log.w(TAG, "lookUpViewClass() - '$className' is not a View subclass")
      return null
    }

    return loaded as Class<View>
  }
}
