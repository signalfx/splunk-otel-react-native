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

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = SplunkSessionReplayModule.NAME)
class SplunkSessionReplayModule(reactContext: ReactApplicationContext) :
  NativeSplunkSessionReplaySpec(reactContext) {

  private val implementation = SplunkSessionReplayImplementation()

  override fun getName(): String = NAME

  override fun start(promise: Promise) = implementation.start(promise)

  override fun stop(promise: Promise) = implementation.stop(promise)

  override fun getState(promise: Promise) = implementation.getState(promise)

  override fun getRecordingMask(promise: Promise) = implementation.getRecordingMask(promise)

  override fun setRecordingMask(mask: ReadableMap?, promise: Promise) =
    implementation.setRecordingMask(mask, promise)

  companion object {
    const val NAME = "SplunkSessionReplay"
  }
}
