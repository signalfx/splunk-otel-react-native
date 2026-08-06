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
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = SplunkOtelReactNativeModule.NAME)
class SplunkOtelReactNativeModule(reactContext: ReactApplicationContext) :
  NativeSplunkOtelReactNativeSpec(reactContext) {

  private val implementation = SplunkOtelReactNativeImplementation(reactApplicationContext)

  override fun getName(): String = NAME

  override fun install(configuration: ReadableMap, modules: ReadableArray, promise: Promise) =
    implementation.install(configuration, modules, promise)

  override fun getEndpointConfiguration(promise: Promise) =
    implementation.getEndpointConfiguration(promise)

  override fun setEndpointConfiguration(endpoint: ReadableMap?, promise: Promise) =
    implementation.setEndpointConfiguration(endpoint, promise)

  override fun getState(promise: Promise) = implementation.getState(promise)

  override fun getSessionState(promise: Promise) = implementation.getSessionState(promise)

  override fun getUserState(promise: Promise) = implementation.getUserState(promise)

  override fun setUserTrackingMode(mode: String?, promise: Promise) =
    implementation.setUserTrackingMode(mode, promise)

  override fun globalAttributesSetString(key: String, value: String?, promise: Promise) =
    implementation.globalAttributesSetString(key, value, promise)

  override fun globalAttributesSetBoolean(key: String, value: Boolean?, promise: Promise) =
    implementation.globalAttributesSetBoolean(key, value, promise)

  override fun globalAttributesSetNumber(key: String, value: Double?, promise: Promise) =
    implementation.globalAttributesSetNumber(key, value, promise)

  override fun globalAttributesSetArray(key: String, value: ReadableArray?, promise: Promise) =
    implementation.globalAttributesSetArray(key, value, promise)

  override fun globalAttributesGetValue(key: String, promise: Promise) =
    implementation.globalAttributesGetValue(key, promise)

  override fun globalAttributesGetString(key: String, promise: Promise) =
    implementation.globalAttributesGetString(key, promise)

  override fun globalAttributesGetBoolean(key: String, promise: Promise) =
    implementation.globalAttributesGetBoolean(key, promise)

  override fun globalAttributesGetNumber(key: String, promise: Promise) =
    implementation.globalAttributesGetNumber(key, promise)

  override fun globalAttributesGetArray(key: String, promise: Promise) =
    implementation.globalAttributesGetArray(key, promise)

  override fun globalAttributesSetAll(map: ReadableMap, promise: Promise) =
    implementation.globalAttributesSetAll(map, promise)

  override fun globalAttributesSetAllInNameSpace(nameSpace: String, map: ReadableMap, promise: Promise) =
    implementation.globalAttributesSetAllInNameSpace(nameSpace, map, promise)

  override fun globalAttributesRemove(key: String, promise: Promise) =
    implementation.globalAttributesRemove(key, promise)

  override fun globalAttributesRemoveAll(promise: Promise) =
    implementation.globalAttributesRemoveAll(promise)

  override fun globalAttributesContains(key: String, promise: Promise) =
    implementation.globalAttributesContains(key, promise)

  override fun globalAttributesGetAll(promise: Promise) =
    implementation.globalAttributesGetAll(promise)

  override fun globalAttributesKeys(promise: Promise) =
    implementation.globalAttributesKeys(promise)

  override fun globalAttributesValues(promise: Promise) =
    implementation.globalAttributesValues(promise)

  override fun globalAttributesSize(promise: Promise) =
    implementation.globalAttributesSize(promise)

  override fun customTrackEvent(name: String, attributes: ReadableMap, promise: Promise) =
    implementation.customTrackEvent(name, attributes, promise)

  override fun customStartWorkflow(name: String, promise: Promise) =
    implementation.customStartWorkflow(name, promise)

  override fun customEndWorkflow(handle: Double, promise: Promise) =
    implementation.customEndWorkflow(handle, promise)

  override fun reportError(
    type: String,
    message: String,
    stacktrace: String,
    attributes: ReadableMap,
    framesJson: String,
    source: String,
    handled: Boolean,
    sourceMapIdsJson: String,
    promise: Promise,
  ) = implementation.reportError(
    type,
    message,
    stacktrace,
    attributes,
    framesJson,
    source,
    handled,
    sourceMapIdsJson,
    promise,
  )

  override fun navigationTrack(screenName: String, attributes: ReadableMap, promise: Promise) =
    implementation.navigationTrack(screenName, attributes, promise)

  override fun integrateWebViewWithBrowserRum(viewTag: Double, promise: Promise) =
    implementation.integrateWebViewWithBrowserRum(viewTag, promise)

  companion object {
    const val NAME = SplunkOtelReactNativeImplementation.NAME
  }
}
