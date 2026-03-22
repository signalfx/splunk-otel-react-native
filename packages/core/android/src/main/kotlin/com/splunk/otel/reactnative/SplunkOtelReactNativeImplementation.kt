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

import android.app.Application
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.splunk.rum.integration.agent.api.SplunkRum
import com.splunk.rum.integration.navigation.extension.navigation

class SplunkOtelReactNativeImplementation(private val reactContext: ReactApplicationContext) {

  private val globalAttributesHandler = GlobalAttributesHandler()
  private val customTrackingHandler = CustomTrackingHandler()
  private val userSessionHandler = UserSessionHandler()
  private val webViewHandler = WebViewHandler(reactContext)

  // MARK: - Installation

  fun install(configuration: ReadableMap, modules: ReadableArray, promise: Promise) {
    UiThreadUtil.runOnUiThread {
      try {
        val app = reactContext.applicationContext as Application
        val agentConfig = AgentConfigurationBuilder.build(configuration)
        val moduleConfigs = ModuleConfigurationBuilder.build(modules)

        SplunkRum.install(app, agentConfig, *moduleConfigs.toTypedArray())
        Log.d(TAG, "install() - status: ${SplunkRum.instance.state.status}")
        promise.resolve(null)
      } catch (t: Throwable) {
        Log.e(TAG, "install() - failed", t)
        promise.reject("E_INSTALL", t)
      }
    }
  }

  // MARK: - Preferences

  fun setEndpointConfiguration(endpoint: ReadableMap?, promise: Promise) {
    try {
      val config = endpoint?.let { AgentConfigurationBuilder.buildEndpoint(it) }
      SplunkRum.instance.preferences.endpointConfiguration = config
      promise.resolve(null)
    } catch (t: Throwable) {
      Log.e(TAG, "setEndpointConfiguration() - failed", t)
      promise.reject("E_SET_ENDPOINT", t)
    }
  }

  companion object {
    private const val TAG = "SplunkOtelRN"
    const val NAME = "SplunkOtelReactNative"
  }

  // MARK: - State / Session / User

  fun getState(promise: Promise) = userSessionHandler.getState(promise)

  fun getSessionState(promise: Promise) = userSessionHandler.getSessionState(promise)

  fun getUserState(promise: Promise) = userSessionHandler.getUserState(promise)

  fun setUserTrackingMode(mode: String?, promise: Promise) =
    userSessionHandler.setUserTrackingMode(mode, promise)

  // MARK: - Global Attributes

  fun globalAttributesSetString(key: String, value: String?, promise: Promise) =
    globalAttributesHandler.setString(key, value, promise)

  fun globalAttributesSetBoolean(key: String, value: Boolean?, promise: Promise) =
    globalAttributesHandler.setBoolean(key, value, promise)

  fun globalAttributesSetNumber(key: String, value: Double?, promise: Promise) =
    globalAttributesHandler.setNumber(key, value, promise)

  fun globalAttributesSetArray(key: String, value: ReadableArray?, promise: Promise) =
    globalAttributesHandler.setArray(key, value, promise)

  fun globalAttributesGetValue(key: String, promise: Promise) =
    globalAttributesHandler.getValue(key, promise)

  fun globalAttributesGetString(key: String, promise: Promise) =
    globalAttributesHandler.getString(key, promise)

  fun globalAttributesGetBoolean(key: String, promise: Promise) =
    globalAttributesHandler.getBoolean(key, promise)

  fun globalAttributesGetNumber(key: String, promise: Promise) =
    globalAttributesHandler.getNumber(key, promise)

  fun globalAttributesGetArray(key: String, promise: Promise) =
    globalAttributesHandler.getArray(key, promise)

  fun globalAttributesSetAll(map: ReadableMap, promise: Promise) =
    globalAttributesHandler.setAll(map, promise)

  fun globalAttributesSetAllInNameSpace(nameSpace: String, map: ReadableMap, promise: Promise) =
    globalAttributesHandler.setAllInNameSpace(nameSpace, map, promise)

  fun globalAttributesRemove(key: String, promise: Promise) =
    globalAttributesHandler.remove(key, promise)

  fun globalAttributesRemoveAll(promise: Promise) =
    globalAttributesHandler.removeAll(promise)

  fun globalAttributesContains(key: String, promise: Promise) =
    globalAttributesHandler.contains(key, promise)

  fun globalAttributesGetAll(promise: Promise) =
    globalAttributesHandler.getAll(promise)

  fun globalAttributesKeys(promise: Promise) =
    globalAttributesHandler.keys(promise)

  fun globalAttributesValues(promise: Promise) =
    globalAttributesHandler.values(promise)

  fun globalAttributesSize(promise: Promise) =
    globalAttributesHandler.size(promise)

  // MARK: - Custom Tracking

  fun customTrackEvent(name: String, attributes: ReadableMap, promise: Promise) =
    customTrackingHandler.trackEvent(name, attributes, promise)

  fun customStartWorkflow(name: String, promise: Promise) =
    customTrackingHandler.startWorkflow(name, promise)

  fun customEndWorkflow(handle: Double, promise: Promise) =
    customTrackingHandler.endWorkflow(handle, promise)

  // MARK: - Navigation

  fun navigationTrack(screenName: String, promise: Promise) {
    try {
      SplunkRum.instance.navigation.track(screenName)
      promise.resolve(null)
    } catch (t: Throwable) {
      promise.reject("E_NAVIGATION_TRACK", t)
    }
  }

  // MARK: - WebView

  fun integrateWebViewWithBrowserRum(viewTag: Double, promise: Promise) =
    webViewHandler.integrateWithBrowserRum(viewTag, promise)
}
