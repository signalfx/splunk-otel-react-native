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

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableNativeArray
import io.opentelemetry.api.common.AttributeKey
import io.opentelemetry.api.common.Attributes
import io.opentelemetry.api.common.AttributesBuilder

/**
 * Converts between ReadableMap/ReadableArray and OpenTelemetry Attributes.
 */
object AttributeConverter {

  fun buildAttributesFromMap(map: ReadableMap): Attributes {
    val builder = Attributes.builder()
    map.entryIterator.forEachRemaining { entry -> putDynamic(builder, entry.key, entry.value) }
    return builder.build()
  }

  fun putDynamic(builder: AttributesBuilder, key: String, value: Any?) {
    when (value) {
      null -> Unit
      is String -> builder.put(AttributeKey.stringKey(key), value)
      is Boolean -> builder.put(AttributeKey.booleanKey(key), value)
      is Int -> builder.put(AttributeKey.longKey(key), value.toLong())
      is Double -> {
        val l = value.toLong()
        if (value == l.toDouble()) builder.put(AttributeKey.longKey(key), l) else builder.put(AttributeKey.doubleKey(key), value)
      }
      is ReadableArray -> putArray(builder, key, value)
      else -> Unit
    }
  }

  fun putArray(builder: AttributesBuilder, key: String, arr: ReadableArray) {
    if (arr.size() == 0) return

    when (arr.getType(0)) {
      ReadableType.String -> {
        val list = mutableListOf<String>()
        for (i in 0 until arr.size()) {
          val s = arr.getString(i)
          if (s != null) list.add(s)
        }

        builder.put(AttributeKey.stringArrayKey(key), list)
      }

      ReadableType.Boolean -> {
        val list = mutableListOf<Boolean>()
        for (i in 0 until arr.size()) list += arr.getBoolean(i)
        
        builder.put(AttributeKey.booleanArrayKey(key), list)
      }

      ReadableType.Number -> {
        var allIntegral = true
        val doubles = mutableListOf<Double>()
        val longs = mutableListOf<Long>()
        for (i in 0 until arr.size()) {
          val d = arr.getDouble(i)
          doubles += d
          val l = d.toLong()
          if (d == l.toDouble()) longs += l else allIntegral = false
        }

        if (allIntegral) builder.put(AttributeKey.longArrayKey(key), longs) else builder.put(AttributeKey.doubleArrayKey(key), doubles)
      }
      else -> Unit
    }
  }

  fun listToWritableArray(list: List<*>): WritableNativeArray {
    val arr = WritableNativeArray()

    list.forEach { item ->
      when (item) {
        is String -> arr.pushString(item)
        is Boolean -> arr.pushBoolean(item)
        is Long -> arr.pushDouble(item.toDouble())
        is Double -> arr.pushDouble(item)
        is Int -> arr.pushDouble(item.toDouble())
      }
    }

    return arr
  }

  fun setArrayToMutableAttributes(
    ga: com.splunk.rum.integration.agent.common.attributes.MutableAttributes,
    key: String,
    arr: ReadableArray
  ) {
    if (arr.size() == 0) return

    when (arr.getType(0)) {
      ReadableType.String -> {
        val list = mutableListOf<String>()

        for (i in 0 until arr.size()) {
          val s = arr.getString(i)
          if (s != null) list.add(s)
        }

        ga[AttributeKey.stringArrayKey(key)] = list
      }

      ReadableType.Boolean -> {
        val list = mutableListOf<Boolean>()

        for (i in 0 until arr.size()) list += arr.getBoolean(i)

        ga[AttributeKey.booleanArrayKey(key)] = list
      }

      ReadableType.Number -> {
        var allIntegral = true
        val doubles = mutableListOf<Double>()
        val longs = mutableListOf<Long>()

        for (i in 0 until arr.size()) {
          val d = arr.getDouble(i)
          doubles += d
          val l = d.toLong()
          if (d == l.toDouble()) longs += l else allIntegral = false
        }

        if (allIntegral) ga[AttributeKey.longArrayKey(key)] = longs else ga[AttributeKey.doubleArrayKey(key)] = doubles
      }

      else -> Unit
    }
  }
}
