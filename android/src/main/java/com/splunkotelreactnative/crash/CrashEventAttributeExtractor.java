/*
 * Copyright Splunk Inc.
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

package com.splunkotelreactnative.crash;

import static io.opentelemetry.api.common.AttributeKey.stringKey;
import static io.opentelemetry.semconv.trace.attributes.SemanticAttributes.EXCEPTION_MESSAGE;
import static io.opentelemetry.semconv.trace.attributes.SemanticAttributes.EXCEPTION_STACKTRACE;
import static io.opentelemetry.semconv.trace.attributes.SemanticAttributes.EXCEPTION_TYPE;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import io.opentelemetry.api.common.AttributeKey;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.common.AttributesBuilder;
import io.opentelemetry.sdk.common.CompletableResultCode;
import io.opentelemetry.sdk.trace.data.DelegatingSpanData;
import io.opentelemetry.sdk.trace.data.EventData;
import io.opentelemetry.sdk.trace.data.SpanData;
import io.opentelemetry.sdk.trace.export.SpanExporter;
import io.opentelemetry.semconv.trace.attributes.SemanticAttributes;

public final class CrashEventAttributeExtractor implements SpanExporter {
  static final AttributeKey<String> ERROR_TYPE_KEY = stringKey("error.type");
  static final AttributeKey<String> ERROR_MESSAGE_KEY = stringKey("error.message");

  private final SpanExporter delegate;

  public CrashEventAttributeExtractor(SpanExporter delegate) {
    this.delegate = delegate;
  }

  @Override
  public CompletableResultCode export(Collection<SpanData> spans) {
    List<SpanData> modifiedSpans = new ArrayList<>(spans.size());
    for (SpanData span : spans) {
      modifiedSpans.add(modify(span));
    }
    return delegate.export(modifiedSpans);
  }

  private SpanData modify(SpanData original) {
    if (original.getEvents().size() == 0) {
      return original;
    }

    List<EventData> modifiedEvents = new ArrayList<>(original.getEvents().size());
    AttributesBuilder modifiedAttributes = original.getAttributes().toBuilder();

    // zipkin eats the event attributes that are recorded by default, so we need to convert
    // the exception event to span attributes
    for (EventData event : original.getEvents()) {
      if (event.getName().equals(SemanticAttributes.EXCEPTION_EVENT_NAME)) {
        modifiedAttributes.putAll(extractExceptionAttributes(event));
      } else {
        // if it's not an exception, leave the event as it is
        modifiedEvents.add(event);
      }
    }

    return new SplunkSpan(original, modifiedEvents, modifiedAttributes.build());
  }

  private static Attributes extractExceptionAttributes(EventData event) {
    String type = event.getAttributes().get(EXCEPTION_TYPE);
    String message = event.getAttributes().get(EXCEPTION_MESSAGE);
    String stacktrace = event.getAttributes().get(EXCEPTION_STACKTRACE);

    AttributesBuilder builder = Attributes.builder();
    if (type != null) {
      int dot = type.lastIndexOf('.');
      String simpleType = dot == -1 ? type : type.substring(dot + 1);
      builder.put(EXCEPTION_TYPE, simpleType);
      // this attribute's here to support the RUM UI/backend until it can be updated to use
      // otel conventions.
      builder.put(ERROR_TYPE_KEY, simpleType);
    }
    if (message != null) {
      builder.put(EXCEPTION_MESSAGE, message);
      // this attribute's here to support the RUM UI/backend until it can be updated to use
      // otel conventions.
      builder.put(ERROR_MESSAGE_KEY, message);
    }
    if (stacktrace != null) {
      builder.put(EXCEPTION_STACKTRACE, stacktrace);
    }
    return builder.build();
  }

  @Override
  public CompletableResultCode flush() {
    return delegate.flush();
  }

  @Override
  public CompletableResultCode shutdown() {
    return delegate.shutdown();
  }

  private static final class SplunkSpan extends DelegatingSpanData {
    private final List<EventData> modifiedEvents;
    private final Attributes modifiedAttributes;

    private SplunkSpan(
      SpanData delegate,
      List<EventData> modifiedEvents,
      Attributes modifiedAttributes) {
      super(delegate);
      this.modifiedEvents = modifiedEvents;
      this.modifiedAttributes = modifiedAttributes;
    }

    @Override
    public List<EventData> getEvents() {
      return modifiedEvents;
    }

    @Override
    public int getTotalRecordedEvents() {
      return modifiedEvents.size();
    }

    @Override
    public Attributes getAttributes() {
      return modifiedAttributes;
    }

    @Override
    public int getTotalAttributeCount() {
      return modifiedAttributes.size();
    }
  }
}
