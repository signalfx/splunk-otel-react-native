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

package com.splunk.otel.reactnative

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.splunk.rum.integration.agent.common.attributes.MutableAttributes
import com.splunk.rum.integration.agent.internal.processor.GlobalAttributeSpanProcessor
import io.opentelemetry.api.common.Attributes
import io.opentelemetry.sdk.common.CompletableResultCode
import io.opentelemetry.sdk.trace.SdkTracerProvider
import io.opentelemetry.sdk.trace.data.SpanData
import io.opentelemetry.sdk.trace.export.SimpleSpanProcessor
import io.opentelemetry.sdk.trace.export.SpanExporter
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized

@RunWith(Parameterized::class)
class AttributeConverterTest(private val initialValue: JavaOnlyArray) {
  companion object {
    @JvmStatic
    @Parameterized.Parameters(name = "{index}: {0}")
    fun arrays(): List<Array<JavaOnlyArray>> = listOf(
      arrayOf(JavaOnlyArray.of("paid")),
      arrayOf(JavaOnlyArray.of(true)),
      arrayOf(JavaOnlyArray.of(42.0)),
      arrayOf(JavaOnlyArray.of(1.5))
    )
  }

  @Test
  fun `empty array replaces the previous value for getters and exported spans`() {
    val attributes = MutableAttributes()
    AttributeConverter.setArrayToMutableAttributes(attributes, "user.tags", initialValue)

    AttributeConverter.setArrayToMutableAttributes(attributes, "user.tags", JavaOnlyArray())

    assertEquals(emptyList<Any>(), attributes.get<List<*>>("user.tags"))
    assertEmptyArrayAndExport(attributes, "user.tags")
  }

  @Test
  fun `bulk updates replace the previous array including namespaced keys`() {
    val attributes = MutableAttributes()
    for (key in listOf("tags", "user.tags")) {
      AttributeConverter.putDynamicToMutableAttributes(attributes, key, initialValue)
      AttributeConverter.putDynamicToMutableAttributes(attributes, key, JavaOnlyArray())

      assertEquals(emptyList<Any>(), attributes.get<List<*>>(key))
      assertEmptyArrayAndExport(attributes, key)
    }
  }

  @Test
  fun `initial attributes preserve empty arrays`() {
    val attributes = AttributeConverter.buildAttributesFromMap(
      JavaOnlyMap.of("user.tags", JavaOnlyArray(), "app.version", "1.0")
    )

    assertEquals(2, attributes.size())
    assertEmptyArrayAndExport(attributes, "user.tags")
  }

  @Test
  fun `span attribute conversion replaces a populated array with an empty array`() {
    val builder = Attributes.builder()
    AttributeConverter.putArray(builder, "user.tags", initialValue)
    AttributeConverter.putArray(builder, "user.tags", JavaOnlyArray())

    val attributes = builder.build()
    assertEquals(1, attributes.size())
    assertEmptyArrayAndExport(attributes, "user.tags")
  }

  @Test
  fun `a cleared array can be populated again`() {
    val attributes = MutableAttributes()
    AttributeConverter.setArrayToMutableAttributes(attributes, "user.tags", initialValue)
    val original = attributes.get<List<*>>("user.tags")
    AttributeConverter.setArrayToMutableAttributes(attributes, "user.tags", JavaOnlyArray())
    AttributeConverter.setArrayToMutableAttributes(attributes, "user.tags", initialValue)

    assertEquals(original, attributes.get<List<*>>("user.tags"))
    assertEquals(1, attributes.size())
  }

  private fun assertEmptyArrayAndExport(attributes: Attributes, key: String) {
    // Inspect by name so a stale value under another OTel array type also fails.
    assertEquals(listOf(emptyList<Any>()), attributes.asMap().filterKeys { it.key == key }.values.toList())

    val exporter = RecordingSpanExporter()
    SdkTracerProvider.builder()
      .addSpanProcessor(GlobalAttributeSpanProcessor(attributes))
      .addSpanProcessor(SimpleSpanProcessor.create(exporter))
      .build().use { provider ->
        provider.get("attribute-converter-test").spanBuilder("after-update").startSpan().end()
      }

    assertEquals(1, exporter.spans.size)
    val exportedValues = exporter.spans.single().attributes.asMap().filterKeys { it.key == key }.values
    assertEquals(listOf(emptyList<Any>()), exportedValues.toList())
  }

  private class RecordingSpanExporter : SpanExporter {
    val spans = mutableListOf<SpanData>()

    override fun export(spans: Collection<SpanData>): CompletableResultCode {
      this.spans.addAll(spans)
      return CompletableResultCode.ofSuccess()
    }

    override fun flush(): CompletableResultCode = CompletableResultCode.ofSuccess()

    override fun shutdown(): CompletableResultCode = CompletableResultCode.ofSuccess()
  }
}
