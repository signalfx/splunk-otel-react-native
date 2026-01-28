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

import android.webkit.WebView
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.UIManagerModule
import com.splunk.rum.integration.webview.WebViewNativeBridge

/**
 * Handles WebView integration.
 */
class WebViewHandler(private val reactContext: ReactApplicationContext) {

  fun integrateWithBrowserRum(viewTag: Double, promise: Promise) {
    try {
      UiThreadUtil.runOnUiThread {
        try {
          val tag = viewTag.toInt()
          val uiManager = UIManagerHelper.getUIManager(reactContext, tag)
          
          val view = when (uiManager) {
            is FabricUIManager -> uiManager.resolveView(tag)
            is UIManagerModule -> uiManager.resolveView(tag)
            else -> null
          }

          if (view is WebView) {
            WebViewNativeBridge.instance.integrateWithBrowserRum(view)
          }

          promise.resolve(null)
        } catch (e: Throwable) {
          promise.reject("E_WEBVIEW", e)
        }
      }
    } catch (t: Throwable) {
      promise.reject("E_WEBVIEW", t)
    }
  }
}
