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
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = SplunkOtelReactNativeModule.NAME)
class SplunkOtelReactNativeModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val implementation = SplunkOtelReactNativeImplementation(reactApplicationContext)

  override fun getName(): String = NAME

  @ReactMethod
  fun install(configuration: ReadableMap, modules: ReadableArray, promise: Promise) =
    implementation.install(configuration, modules, promise)

  @ReactMethod
  fun getEndpointConfiguration(promise: Promise) =
    implementation.getEndpointConfiguration(promise)

  @ReactMethod
  fun setEndpointConfiguration(endpoint: ReadableMap?, promise: Promise) =
    implementation.setEndpointConfiguration(endpoint, promise)

  @ReactMethod
  fun getState(promise: Promise) = implementation.getState(promise)

  @ReactMethod
  fun getSessionState(promise: Promise) = implementation.getSessionState(promise)

  @ReactMethod
  fun getUserState(promise: Promise) = implementation.getUserState(promise)

  @ReactMethod
  fun setUserTrackingMode(mode: String?, promise: Promise) =
    implementation.setUserTrackingMode(mode, promise)

  @ReactMethod
  fun globalAttributesSetString(key: String, value: String?, promise: Promise) =
    implementation.globalAttributesSetString(key, value, promise)

  @ReactMethod
  fun globalAttributesSetBoolean(key: String, value: Boolean?, promise: Promise) =
    implementation.globalAttributesSetBoolean(key, value, promise)

  @ReactMethod
  fun globalAttributesSetNumber(key: String, value: Double?, promise: Promise) =
    implementation.globalAttributesSetNumber(key, value, promise)

  @ReactMethod
  fun globalAttributesSetArray(key: String, value: ReadableArray?, promise: Promise) =
    implementation.globalAttributesSetArray(key, value, promise)

  @ReactMethod
  fun globalAttributesGetValue(key: String, promise: Promise) =
    implementation.globalAttributesGetValue(key, promise)

  @ReactMethod
  fun globalAttributesGetString(key: String, promise: Promise) =
    implementation.globalAttributesGetString(key, promise)

  @ReactMethod
  fun globalAttributesGetBoolean(key: String, promise: Promise) =
    implementation.globalAttributesGetBoolean(key, promise)

  @ReactMethod
  fun globalAttributesGetNumber(key: String, promise: Promise) =
    implementation.globalAttributesGetNumber(key, promise)

  @ReactMethod
  fun globalAttributesGetArray(key: String, promise: Promise) =
    implementation.globalAttributesGetArray(key, promise)

  @ReactMethod
  fun globalAttributesSetAll(map: ReadableMap, promise: Promise) =
    implementation.globalAttributesSetAll(map, promise)

  @ReactMethod
  fun globalAttributesSetAllInNameSpace(nameSpace: String, map: ReadableMap, promise: Promise) =
    implementation.globalAttributesSetAllInNameSpace(nameSpace, map, promise)

  @ReactMethod
  fun globalAttributesRemove(key: String, promise: Promise) =
    implementation.globalAttributesRemove(key, promise)

  @ReactMethod
  fun globalAttributesRemoveAll(promise: Promise) =
    implementation.globalAttributesRemoveAll(promise)

  @ReactMethod
  fun globalAttributesContains(key: String, promise: Promise) =
    implementation.globalAttributesContains(key, promise)

  @ReactMethod
  fun globalAttributesGetAll(promise: Promise) =
    implementation.globalAttributesGetAll(promise)

  @ReactMethod
  fun globalAttributesKeys(promise: Promise) =
    implementation.globalAttributesKeys(promise)

  @ReactMethod
  fun globalAttributesValues(promise: Promise) =
    implementation.globalAttributesValues(promise)

  @ReactMethod
  fun globalAttributesSize(promise: Promise) =
    implementation.globalAttributesSize(promise)

  @ReactMethod
  fun customTrackEvent(name: String, attributes: ReadableMap, promise: Promise) =
    implementation.customTrackEvent(name, attributes, promise)

  @ReactMethod
  fun customStartWorkflow(name: String, promise: Promise) =
    implementation.customStartWorkflow(name, promise)

  @ReactMethod
  fun customEndWorkflow(handle: Double, promise: Promise) =
    implementation.customEndWorkflow(handle, promise)

  @ReactMethod
  fun navigationTrack(screenName: String, promise: Promise) =
    implementation.navigationTrack(screenName, promise)

  @ReactMethod
  fun integrateWebViewWithBrowserRum(viewTag: Double, promise: Promise) =
    implementation.integrateWebViewWithBrowserRum(viewTag, promise)

  companion object {
    const val NAME = SplunkOtelReactNativeImplementation.NAME
  }
}
