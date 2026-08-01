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
import io.opentelemetry.api.common.AttributeKey
import io.opentelemetry.api.common.Attributes

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

  /**
   * Reports a caught JS error as a `component=error` span with an explicit,
   * pre-formatted stacktrace.
   *
   * Routes to the native explicit-stack API
   * (`CustomTracking.trackError(type, message, stacktrace, attributes)`), which
   * sets `exception.type`, `exception.message`, `exception.stacktrace`,
   * `error=true`, and `component=error` without deriving the stack from a JVM
   * `Throwable`. `ErrorIdentifierAttributesSpanProcessor` then auto-adds
   * `service.application_id`, `service.version_code`, and `splunk.build_id`
   * because `component == error`.
   *
   * Caller attributes are applied first so the agent-managed keys added here
   * take precedence on conflict.
   *
   * @param framesJson reserved for a later phase (backend symbolicates from the
   *   raw `exception.stacktrace`); currently unused.
   * @param timestampMs reserved for forward compatibility; the native API emits
   *   the span at publish time and does not yet accept a caller timestamp.
   */
  fun reportError(
    type: String,
    message: String,
    stacktrace: String,
    attributes: ReadableMap,
    @Suppress("UNUSED_PARAMETER") framesJson: String,
    source: String,
    handled: Boolean,
    @Suppress("UNUSED_PARAMETER") timestampMs: Double,
    sourceMapIdsJson: String,
    promise: Promise,
  ) {
    try {
      val builder = Attributes.builder()

      // Caller attributes first; agent-managed keys below win on conflict.
      attributes.entryIterator.forEachRemaining { entry ->
        AttributeConverter.putDynamic(builder, entry.key, entry.value)
      }

      builder.put(AttributeKey.stringKey("error.source"), source)
      builder.put(AttributeKey.booleanKey("exception.escaped"), !handled)
      builder.put(AttributeKey.stringKey(PLATFORM_ATTRIBUTE_KEY), PLATFORM_ATTRIBUTE_VALUE)

      if (sourceMapIdsJson.isNotEmpty()) {
        builder.put(AttributeKey.stringKey("error.sourceMapIds"), sourceMapIdsJson)
      }

      CustomTracking.instance.trackError(
        type,
        message,
        stacktrace.ifEmpty { null },
        builder.build(),
      )

      promise.resolve(null)
    } catch (t: Throwable) {
      promise.reject("E_REPORT_ERROR", t)
    }
  }

  companion object {
    /**
     * Marks the cross-platform layer the error originates from, for backend
     * symbolication and UI routing.
     */
    private const val PLATFORM_ATTRIBUTE_KEY = "splunk.rum.platform"
    private const val PLATFORM_ATTRIBUTE_VALUE = "react-native"
  }
}
