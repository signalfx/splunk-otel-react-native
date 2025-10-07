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

import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.sdk.trace.data.StatusData;

public class ReactSpanProperties {
  @NonNull public final String name;
  @NonNull public final SpanKind kind;
  @NonNull public final StatusData statusData;
  public final long startEpochNanos;
  public final long endEpochNanos;

  public ReactSpanProperties(
    @NonNull String name,
    @NonNull SpanKind kind,
    @NonNull StatusData statusData,
    long startEpochNanos,
    long endEpochNanos
  ) {
    this.name = name;
    this.kind = kind;
    this.statusData = statusData;
    this.startEpochNanos = startEpochNanos;
    this.endEpochNanos = endEpochNanos;
  }
}
