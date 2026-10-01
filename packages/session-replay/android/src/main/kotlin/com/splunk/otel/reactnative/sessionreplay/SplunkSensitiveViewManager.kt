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

import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager
import com.splunk.rum.integration.sessionreplay.api.SessionReplay
import java.lang.ref.WeakReference
import java.util.WeakHashMap

/**
 * View manager backing the `<SensitiveView>` component.
 *
 * Extends [ReactViewManager] rather than a bare `ViewGroupManager` on purpose.
 * `<SensitiveView>` accepts the full `ViewProps` surface, and `ReactViewManager`
 * is where React Native declares the two dozen props that go beyond the base
 * manager - borders, border radii, `overflow`, `hitSlop`, `pointerEvents`,
 * background images, the focus-order family. Subclassing inherits all of them
 * through the same reflection-based dispatch `<View>` itself uses, so styling
 * keeps working and nothing has to be re-declared here on every React Native
 * upgrade.
 *
 * For the same reason this deliberately does **not** implement the generated
 * `SplunkSensitiveViewManagerInterface`: supplying a codegen delegate would
 * route props through a `setProperty` that only knows `sensitive` and would
 * silently drop everything [ReactViewManager] adds.
 */
@ReactModule(name = SplunkSensitiveViewManager.NAME)
class SplunkSensitiveViewManager : ReactViewManager() {

  override fun getName(): String = NAME

  /** Sensitivity requested for views that could not be marked yet. */
  private val pending = WeakHashMap<View, Boolean>()

  private val handler = Handler(Looper.getMainLooper())

  /**
   * Applies session replay sensitivity to the view itself.
   *
   * Because the flag lives on a view this manager owns, it is set when the
   * view is created and released in [onDropViewInstance] - there is no React
   * tag to resolve and nothing for the JavaScript layer to remember.
   *
   * A view can mount before the agent is installed, since `SplunkRumProvider`
   * renders its children synchronously and installs from an effect. React
   * Native will not re-apply an unchanged prop, so failing here once would
   * leave the view unmarked for its whole lifetime. The request is therefore
   * retained and retried until it lands.
   */
  @ReactProp(name = "sensitive", defaultBoolean = true)
  fun setSensitive(view: ReactViewGroup, isSensitive: Boolean) {
    if (applySensitivity(view, isSensitive)) {
      pending.remove(view)
      return
    }

    pending[view] = isSensitive
    scheduleRetry(view, attempt = 0)
  }

  override fun onDropViewInstance(view: ReactViewGroup) {
    pending.remove(view)

    // Android recycles views, and instance sensitivity is stored as a view tag
    // that would otherwise outlive this component and mask whatever is mounted
    // next.
    applySensitivity(view, null)

    super.onDropViewInstance(view)
  }

  /** Returns whether the value was applied, rather than throwing. */
  private fun applySensitivity(view: View, isSensitive: Boolean?): Boolean =
    try {
      SessionReplay.instance.sensitivity.setViewInstanceSensitivity(view, isSensitive)
      true
    } catch (t: Throwable) {
      // Session replay is not installed yet, or not installed at all.
      false
    }

  private fun scheduleRetry(view: View, attempt: Int) {
    if (attempt >= RETRY_LIMIT) {
      pending.remove(view)
      Log.w(TAG, "sensitivity could not be applied; session replay is unavailable")
      return
    }

    // Held weakly so a pending retry can never keep a detached view alive.
    val viewRef = WeakReference(view)

    handler.postDelayed({
      val target = viewRef.get() ?: return@postDelayed
      val desired = pending[target] ?: return@postDelayed

      if (applySensitivity(target, desired)) {
        pending.remove(target)
      } else {
        scheduleRetry(target, attempt + 1)
      }
    }, RETRY_DELAY_MS)
  }

  companion object {
    const val NAME = "SplunkSensitiveView"
    private const val TAG = "SplunkSensitiveView"

    /** Roughly ten seconds, which comfortably covers agent installation. */
    private const val RETRY_LIMIT = 40
    private const val RETRY_DELAY_MS = 250L
  }
}
