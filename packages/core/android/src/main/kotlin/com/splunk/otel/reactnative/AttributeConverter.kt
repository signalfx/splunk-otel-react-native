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
import com.splunk.rum.integration.agent.common.attributes.MutableAttributes
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
    when (elementType(arr)) {
      ReadableType.String -> builder.put(AttributeKey.stringArrayKey(key), stringElements(arr))
      ReadableType.Boolean -> builder.put(AttributeKey.booleanArrayKey(key), booleanElements(arr))
      ReadableType.Number -> {
        val numbers = numberElements(arr)
        val longs = integralOrNull(numbers)
        if (longs != null) builder.put(AttributeKey.longArrayKey(key), longs) else builder.put(AttributeKey.doubleArrayKey(key), numbers)
      }
      else -> Unit
    }
  }

  /**
   * Attribute arrays must be homogeneous, so an array takes the type of its
   * first non-null element. Nulls and elements of any other type are dropped,
   * because the `ReadableArray` getters throw on a type mismatch.
   */
  private fun elementType(arr: ReadableArray): ReadableType? =
    (0 until arr.size()).map { arr.getType(it) }.firstOrNull { it != ReadableType.Null }

  private fun indicesOf(arr: ReadableArray, type: ReadableType): List<Int> =
    (0 until arr.size()).filter { arr.getType(it) == type }

  private fun stringElements(arr: ReadableArray): List<String> =
    indicesOf(arr, ReadableType.String).mapNotNull { arr.getString(it) }

  private fun booleanElements(arr: ReadableArray): List<Boolean> =
    indicesOf(arr, ReadableType.Boolean).map { arr.getBoolean(it) }

  private fun numberElements(arr: ReadableArray): List<Double> =
    indicesOf(arr, ReadableType.Number).map { arr.getDouble(it) }

  private fun integralOrNull(numbers: List<Double>): List<Long>? {
    val longs = numbers.map { it.toLong() }
    return if (numbers.indices.all { numbers[it] == longs[it].toDouble() }) longs else null
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

  fun putDynamicToMutableAttributes(
    ga: MutableAttributes,
    key: String,
    value: Any?
  ) {
    when (value) {
      null -> Unit
      is String -> ga[key] = value
      is Boolean -> ga[key] = value
      is Int -> ga[key] = value.toLong()
      is Double -> {
        val l = value.toLong()
        if (value == l.toDouble()) ga[key] = l else ga[key] = value
      }
      is ReadableArray -> setArrayToMutableAttributes(ga, key, value)
      else -> Unit
    }
  }

  fun setArrayToMutableAttributes(
    ga: MutableAttributes,
    key: String,
    arr: ReadableArray
  ) {
    when (elementType(arr)) {
      ReadableType.String -> ga[AttributeKey.stringArrayKey(key)] = stringElements(arr)
      ReadableType.Boolean -> ga[AttributeKey.booleanArrayKey(key)] = booleanElements(arr)
      ReadableType.Number -> {
        val numbers = numberElements(arr)
        val longs = integralOrNull(numbers)
        if (longs != null) ga[AttributeKey.longArrayKey(key)] = longs else ga[AttributeKey.doubleArrayKey(key)] = numbers
      }
      else -> Unit
    }
  }
}
