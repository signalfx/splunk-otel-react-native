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
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager
import com.splunk.rum.integration.sessionreplay.api.SessionReplay

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

  /**
   * Applies session replay sensitivity to the view itself.
   *
   * Because the flag lives on a view this manager owns, it is set when the
   * view is created and released in [onDropViewInstance] - there is no React
   * tag to resolve and nothing for the JavaScript layer to remember.
   */
  @ReactProp(name = "sensitive", defaultBoolean = true)
  fun setSensitive(view: ReactViewGroup, isSensitive: Boolean) {
    try {
      SessionReplay.instance.sensitivity.setViewInstanceSensitivity(view, isSensitive)
    } catch (t: Throwable) {
      // Session replay may not be installed. Masking is best-effort here; the
      // imperative API reports failures to callers that need to know.
      Log.w(TAG, "setSensitive() - failed", t)
    }
  }

  override fun onDropViewInstance(view: ReactViewGroup) {
    // Android recycles views, and instance sensitivity is stored as a view tag
    // that would otherwise outlive this component and mask whatever is mounted
    // next.
    try {
      SessionReplay.instance.sensitivity.setViewInstanceSensitivity(view, null)
    } catch (t: Throwable) {
      Log.w(TAG, "onDropViewInstance() - failed to clear sensitivity", t)
    }

    super.onDropViewInstance(view)
  }

  companion object {
    const val NAME = "SplunkSensitiveView"
    private const val TAG = "SplunkSensitiveView"
  }
}
