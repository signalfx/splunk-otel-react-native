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
import com.facebook.react.bridge.ReadableMap
import com.splunk.rum.integration.customtracking.CustomTracking

/**
 * Handles custom tracking operations.
 */
class CustomTrackingHandler {

  fun trackEvent(name: String, attributes: ReadableMap, promise: Promise) {
    try {
      val attrs = AttributeConverter.buildAttributesFromMap(attributes)
      CustomTracking.instance.trackCustomEvent(name, attrs)

      promise.resolve(null)
    } catch (t: Throwable) {
      promise.reject("E_CT_EVENT", t)
    }
  }

  fun startWorkflow(name: String, promise: Promise) {
    try {
      val span = CustomTracking.instance.trackWorkflow(name)
      val handle = WorkflowSpanStore.put(span)

      promise.resolve(handle)
    } catch (t: Throwable) {
      promise.reject("E_CT_START", t)
    }
  }

  fun endWorkflow(handle: Double, promise: Promise) {
    try {
      val span = WorkflowSpanStore.remove(handle.toInt())
      span?.end()

      promise.resolve(null)
    } catch (t: Throwable) {
      promise.reject("E_CT_END", t)
    }
  }
}
