/*
Copyright 2022 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package com.splunkotelreactnative;

import androidx.annotation.NonNull;

import java.util.Collections;
import java.util.List;

import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.trace.SpanContext;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.sdk.common.InstrumentationLibraryInfo;
import io.opentelemetry.sdk.resources.Resource;
import io.opentelemetry.sdk.trace.data.EventData;
import io.opentelemetry.sdk.trace.data.LinkData;
import io.opentelemetry.sdk.trace.data.SpanData;
import io.opentelemetry.sdk.trace.data.StatusData;

public class ReactSpanData implements SpanData {
  @NonNull private final ReactSpanProperties properties;
  @NonNull private final Attributes attributes;
  @NonNull private final SpanContext context;
  @NonNull private final SpanContext parentContext;

  public ReactSpanData(
    @NonNull ReactSpanProperties properties,
    @NonNull Attributes attributes,
    @NonNull SpanContext context,
    @NonNull SpanContext parentContext
  ) {
    this.properties = properties;
    this.attributes = attributes;
    this.context = context;
    this.parentContext = parentContext;
  }

  @Override
  public String getName() {
    return properties.name;
  }

  @Override
  public SpanKind getKind() {
    return properties.kind;
  }

  @Override
  public SpanContext getSpanContext() {
    return context;
  }

  @Override
  public SpanContext getParentSpanContext() {
    return parentContext;
  }

  @Override
  public StatusData getStatus() {
    return properties.statusData;
  }

  @Override
  public long getStartEpochNanos() {
    return properties.startEpochNanos;
  }

  @Override
  public Attributes getAttributes() {
    return attributes;
  }

  @Override
  public List<EventData> getEvents() {
    return Collections.emptyList();
  }

  @Override
  public List<LinkData> getLinks() {
    return Collections.emptyList();
  }

  @Override
  public long getEndEpochNanos() {
    return properties.endEpochNanos;
  }

  @Override
  public boolean hasEnded() {
    return true;
  }

  @Override
  public int getTotalRecordedEvents() {
    return 0;
  }

  @Override
  public int getTotalRecordedLinks() {
    return 0;
  }

  @Override
  public int getTotalAttributeCount() {
    return attributes.size();
  }

  @Override
  public InstrumentationLibraryInfo getInstrumentationLibraryInfo() {
    return InstrumentationLibraryInfo.empty();
  }

  @Override
  public Resource getResource() {
    return Resource.empty();
  }
}
