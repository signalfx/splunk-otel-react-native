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
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.splunk.rum.integration.agent.api.SplunkRum

/**
 * Handles all global attributes operations.
 */
class GlobalAttributesHandler {

  // MARK: - Setters

  fun setString(key: String, value: String?, promise: Promise) {
    try {
      val ga = SplunkRum.instance.globalAttributes
      if (value == null) ga.remove(key) else ga[key] = value
      promise.resolve(null)
    } catch (t: Throwable) {
      promise.reject("E_GA_SET_STRING", t)
    }
  }

  fun setBoolean(key: String, value: Boolean?, promise: Promise) {
    try {
      val ga = SplunkRum.instance.globalAttributes
      if (value == null) ga.remove(key) else ga[key] = value
      promise.resolve(null)
    } catch (t: Throwable) {
      promise.reject("E_GA_SET_BOOLEAN", t)
    }
  }

  fun setNumber(key: String, value: Double?, promise: Promise) {
    try {
      val ga = SplunkRum.instance.globalAttributes
      if (value == null) {
        ga.remove(key)
      } else {
        val longLike = value.toLong()
        if (value == longLike.toDouble()) ga[key] = longLike else ga[key] = value
      }

      promise.resolve(null)
    } catch (t: Throwable) {
      promise.reject("E_GA_SET_NUMBER", t)
    }
  }

  fun setArray(key: String, value: ReadableArray?, promise: Promise) {
    try {
      val ga = SplunkRum.instance.globalAttributes
      if (value == null) {
        ga.remove(key)
      } else {
        AttributeConverter.setArrayToMutableAttributes(ga, key, value)
      }

      promise.resolve(null)
    } catch (t: Throwable) {
      promise.reject("E_GA_SET_ARRAY", t)
    }
  }

  // MARK: - Getters

  fun getValue(key: String, promise: Promise) {
    try {
      val v = getAnyValue(key)
      promise.resolve(v)
    } catch (t: Throwable) {
      promise.reject("E_GA_GET_VALUE", t)
    }
  }

  fun getString(key: String, promise: Promise) {
    try {
      val ga = SplunkRum.instance.globalAttributes
      val v = ga.get<String>(key)

      promise.resolve(v)
    } catch (t: Throwable) {
      promise.reject("E_GA_GET_STRING", t)
    }
  }

  fun getBoolean(key: String, promise: Promise) {
    try {
      val ga = SplunkRum.instance.globalAttributes
      val v = ga.get<Boolean>(key)

      promise.resolve(v)
    } catch (t: Throwable) {
      promise.reject("E_GA_GET_BOOLEAN", t)
    }
  }

  fun getNumber(key: String, promise: Promise) {
    try {
      val ga = SplunkRum.instance.globalAttributes
      val l = ga.get<Long>(key)

      if (l != null) {
        promise.resolve(l.toDouble())
      } else {
        val d = ga.get<Double>(key)
        promise.resolve(d)
      }
    } catch (t: Throwable) {
      promise.reject("E_GA_GET_NUMBER", t)
    }
  }

  fun getArray(key: String, promise: Promise) {
    try {
      val array = getArrayValue(key)
      promise.resolve(array)
    } catch (t: Throwable) {
      promise.reject("E_GA_GET_ARRAY", t)
    }
  }

  // MARK: - Bulk Operations

  fun setAll(map: ReadableMap, promise: Promise) {
    try {
      val ga = SplunkRum.instance.globalAttributes
      var count = 0

      map.entryIterator.forEachRemaining { entry ->
        AttributeConverter.putDynamicToMutableAttributes(ga, entry.key, entry.value)
        count++
      }

      promise.resolve(count)
    } catch (t: Throwable) {
      promise.reject("E_GA_SET_ALL", t)
    }
  }

  fun setAllInNameSpace(nameSpace: String, map: ReadableMap, promise: Promise) {
    try {
      val ga = SplunkRum.instance.globalAttributes
      var count = 0

      map.entryIterator.forEachRemaining { entry ->
        AttributeConverter.putDynamicToMutableAttributes(ga, "$nameSpace.${entry.key}", entry.value)
        count++
      }

      promise.resolve(count)
    } catch (t: Throwable) {
      promise.reject("E_GA_SET_ALL_NS", t)
    }
  }

  fun remove(key: String, promise: Promise) {
    try {
      val prev = getAnyValue(key)
      SplunkRum.instance.globalAttributes.remove(key)

      promise.resolve(prev)
    } catch (t: Throwable) {
      promise.reject("E_GA_REMOVE", t)
    }
  }

  fun removeAll(promise: Promise) {
    try {
      SplunkRum.instance.globalAttributes.removeAll()
      promise.resolve(null)
    } catch (t: Throwable) {
      promise.reject("E_GA_REMOVE_ALL", t)
    }
  }

  fun contains(key: String, promise: Promise) {
    try {
      val contains = SplunkRum.instance.globalAttributes.contains(key)
      promise.resolve(contains)
    } catch (t: Throwable) {
      promise.reject("E_GA_CONTAINS", t)
    }
  }

  fun getAll(promise: Promise) {
    try {
      val attrs = SplunkRum.instance.globalAttributes.getAll()
      val map = WritableNativeMap()

      attrs.asMap().forEach { (k, v) ->
        when (v) {
          is String -> map.putString(k.key, v)
          is Boolean -> map.putBoolean(k.key, v)
          is Long -> map.putDouble(k.key, v.toDouble())
          is Double -> map.putDouble(k.key, v)
          is List<*> -> map.putArray(k.key, AttributeConverter.listToWritableArray(v))
        }
      }

      promise.resolve(map)
    } catch (t: Throwable) {
      promise.reject("E_GA_GET_ALL", t)
    }
  }

  fun keys(promise: Promise) {
    try {
      val attrs = SplunkRum.instance.globalAttributes.getAll()
      val array = WritableNativeArray()

      attrs.asMap().keys.forEach { array.pushString(it.key) }

      promise.resolve(array)
    } catch (t: Throwable) {
      promise.reject("E_GA_KEYS", t)
    }
  }

  fun values(promise: Promise) {
    try {
      val attrs = SplunkRum.instance.globalAttributes.getAll()
      val array = WritableNativeArray()

      attrs.asMap().values.forEach { v ->
        when (v) {
          is String -> array.pushString(v)
          is Boolean -> array.pushBoolean(v)
          is Long -> array.pushDouble(v.toDouble())
          is Double -> array.pushDouble(v)
          is List<*> -> array.pushArray(AttributeConverter.listToWritableArray(v))
        }
      }

      promise.resolve(array)
    } catch (t: Throwable) {
      promise.reject("E_GA_VALUES", t)
    }
  }

  fun size(promise: Promise) {
    try {
      val size = SplunkRum.instance.globalAttributes.size()
      promise.resolve(size)
    } catch (t: Throwable) {
      promise.reject("E_GA_SIZE", t)
    }
  }

  // MARK: - Private Helpers

  private fun getAnyValue(key: String): Any? {
    val ga = SplunkRum.instance.globalAttributes
    ga.get<String>(key)?.let { return it }
    ga.get<Boolean>(key)?.let { return it }
    ga.get<Long>(key)?.let { return it.toDouble() }
    ga.get<Double>(key)?.let { return it }

    val entry = SplunkRum.instance.globalAttributes.getAll().asMap().entries.firstOrNull { it.key.key == key }
    return when (val v = entry?.value) {
      is List<*> -> AttributeConverter.listToWritableArray(v)
      else -> null
    }
  }

  private fun getArrayValue(key: String): WritableNativeArray? {
    val entry = SplunkRum.instance.globalAttributes.getAll().asMap().entries.firstOrNull { it.key.key == key }
    
    return when (val v = entry?.value) {
      is List<*> -> AttributeConverter.listToWritableArray(v)
      else -> null
    }
  }
}
