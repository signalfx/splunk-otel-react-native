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
