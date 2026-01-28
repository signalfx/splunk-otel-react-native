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

import io.opentelemetry.api.trace.Span

/**
 * Thread-safe storage for workflow spans with handle-based access.
 */
object WorkflowSpanStore {
  private val spans = HashMap<Int, Span?>()
  private var next = 1

  @Synchronized
  fun put(span: Span?): Int {
    val h = next++
    spans[h] = span
    return h
  }

  @Synchronized
  fun remove(handle: Int): Span? = spans.remove(handle)
}
