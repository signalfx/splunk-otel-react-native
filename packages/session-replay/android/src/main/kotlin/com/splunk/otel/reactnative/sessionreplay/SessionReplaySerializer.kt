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

import android.graphics.Rect
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.splunk.rum.integration.sessionreplay.api.RecordingMask
import com.splunk.rum.integration.sessionreplay.api.RenderingMode
import com.splunk.rum.integration.sessionreplay.api.State
import com.splunk.rum.integration.sessionreplay.api.Status

internal object SessionReplaySerializer {

  // MARK: - State

  fun serializeState(state: State): WritableNativeMap {
    return WritableNativeMap().apply {
      putString("status", serializeStatus(state.status))
      putBoolean("isRecording", state.status.isRecording)

      putDouble("samplingRate", state.samplingRate.toDouble())
      putString("renderingMode", serializeRenderingMode(state.renderingMode))
    }
  }

  // MARK: - Rendering Mode

  fun serializeRenderingMode(mode: RenderingMode): String = when (mode) {
    RenderingMode.NATIVE -> "native"
    RenderingMode.WIREFRAME_ONLY -> "wireframeOnly"
  }

  fun deserializeRenderingMode(mode: String): RenderingMode? = when (mode) {
    "native" -> RenderingMode.NATIVE
    "wireframeOnly" -> RenderingMode.WIREFRAME_ONLY
    else -> null
  }

  // MARK: - Status

  fun serializeStatus(status: Status): String {
    return when (status) {
      is Status.Recording -> "recording"
      is Status.NotRecording -> when (status.cause) {
        Status.NotRecording.Cause.NOT_STARTED -> "notStarted"
        Status.NotRecording.Cause.STOPPED -> "stopped"
        Status.NotRecording.Cause.INTERNAL_ERROR -> "internalError"
        Status.NotRecording.Cause.BELOW_MIN_SDK_VERSION -> "belowMinSdkVersion"
        Status.NotRecording.Cause.STORAGE_LIMIT_REACHED -> "storageLimitReached"
        Status.NotRecording.Cause.DISABLED_BY_SAMPLING -> "disabledBySampling"
      }
    }
  }

  // MARK: - Recording Mask

  fun serializeRecordingMask(mask: RecordingMask): WritableNativeMap {
    val elementsArray = WritableNativeArray()
    for (element in mask.elements) {
      elementsArray.pushMap(serializeMaskElement(element))
    }

    return WritableNativeMap().apply {
      putArray("elements", elementsArray)
    }
  }

  /**
   * The JavaScript API expresses mask rects in React Native layout units, but
   * [RecordingMask.Element] rects are in physical device pixels. Convert on the
   * way out so the same coordinates mean the same thing on both platforms,
   * where iOS `CGRect` points already match layout units.
   */
  private fun serializeMaskElement(element: RecordingMask.Element): WritableNativeMap {
    return WritableNativeMap().apply {
      putDouble("x", toLayoutUnits(element.rect.left))
      putDouble("y", toLayoutUnits(element.rect.top))

      putDouble("width", toLayoutUnits(element.rect.right - element.rect.left))
      putDouble("height", toLayoutUnits(element.rect.bottom - element.rect.top))

      putString("type", when (element.type) {
        RecordingMask.Element.Type.COVERING -> "covering"
        RecordingMask.Element.Type.ERASING -> "erasing"
      })
    }
  }

  private fun toLayoutUnits(pixels: Int): Double =
    PixelUtil.toDIPFromPixel(pixels.toFloat()).toDouble()

  private fun toPixels(layoutUnits: Double): Int =
    Math.round(PixelUtil.toPixelFromDIP(layoutUnits.toFloat()))

  // MARK: - Sensitivity

  fun serializeSensitivity(isSensitive: Boolean?): String = when (isSensitive) {
    true -> "sensitive"
    false -> "notSensitive"
    null -> "unset"
  }

  // MARK: - Recording Mask

  fun deserializeRecordingMask(map: ReadableMap?): RecordingMask? {
    if (map == null) return null
    val elementsArray = map.getArray("elements") ?: return null

    val elements = (0 until elementsArray.size()).mapNotNull { i ->
      val item = elementsArray.getMap(i) ?: return@mapNotNull null

      val x = toPixels(item.getDouble("x"))
      val y = toPixels(item.getDouble("y"))

      val width = toPixels(item.getDouble("width"))
      val height = toPixels(item.getDouble("height"))

      val typeStr = if (item.hasKey("type")) item.getString("type") else "covering"
      val maskType = if (typeStr == "erasing") {
        RecordingMask.Element.Type.ERASING
      } else {
        RecordingMask.Element.Type.COVERING
      }

      RecordingMask.Element(Rect(x, y, x + width, y + height), maskType)
    }

    return RecordingMask(elements)
  }
}
