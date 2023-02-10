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

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.splunkotelreactnative.crash.CrashEventAttributeExtractor;
import com.splunkotelreactnative.crash.CrashReporter;

import java.util.Collections;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.common.AttributesBuilder;
import io.opentelemetry.api.trace.SpanContext;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.TraceFlags;
import io.opentelemetry.api.trace.TraceState;
import io.opentelemetry.exporter.zipkin.ZipkinSpanExporterBuilder;
import io.opentelemetry.sdk.trace.data.StatusData;
import io.opentelemetry.sdk.trace.export.SpanExporter;
import io.opentelemetry.exporter.otlp.http.trace.OtlpHttpSpanExporter;

@ReactModule(name = SplunkOtelReactNativeModule.NAME)
public class SplunkOtelReactNativeModule extends ReactContextBaseJavaModule {
  public static final String NAME = "SplunkOtelReactNative";

  private final long moduleStartTime;
  private volatile SpanExporter exporter;
  private volatile CrashReporter crashReporter;

  public SplunkOtelReactNativeModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.moduleStartTime = System.currentTimeMillis();
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void initialize(ReadableMap configMap, Promise promise) {
    ConfigMapReader mapReader = new ConfigMapReader(configMap);
    String beaconEndpoint = mapReader.getBeaconEndpoint();
    String accessToken = mapReader.getRumAccessToken();
    boolean isOtlp = mapReader.isOtlp();
    boolean skipEncode = mapReader.skipEncode();
    boolean skipAuth = mapReader.skipAuth();

    if (beaconEndpoint == null || accessToken == null) {
      reportFailure(promise, "Initialize: cannot construct exporter, endpoint or token missing");
      return;
    }

    String endpointWithAuthentication = beaconEndpoint + "?auth=" + accessToken;

    if(isOtlp) {
    exporter = new CrashEventAttributeExtractor(new ZipkinSpanExporterBuilder()
      .setEndpoint(skipAuth ? beaconEndpoint : endpointWithAuthentication)
      .setEncoder(skipEncode ? null : new CustomZipkinEncoder())
      .build());
    }
    else {
    exporter = new CrashEventAttributeExtractor(OtlpHttpSpanExporter.builder()
      .setEndpoint(beaconEndpoint)
      .setTimeout(2, TimeUnit.SECONDS)
      .build());
    }

    crashReporter = new CrashReporter(exporter,
      attributesFromMap(mapReader.getGlobalAttributes()), getReactApplicationContext());

    crashReporter.install();

    promise.resolve((double) moduleStartTime);
  }


  @ReactMethod
  public void nativeCrash() {
    new Thread(() -> {
      try {
        Thread.sleep(2000);
      } catch (InterruptedException e) {}
      throw new RuntimeException("test crash");
    }).start();
  }

  @ReactMethod
  public void export(ReadableMap spanMap, Promise promise) {
    SpanExporter currentExporter = exporter;
    SpanMapReader mapReader = new SpanMapReader(spanMap);

    if (currentExporter == null) {
      reportFailure(promise, "Export: exporter not initialized");
      return;
    }

    SpanContext context = contextFromMap(mapReader);

    if (!context.isValid()) {
      reportFailure(promise, "Export: trace or span ID not provided");
      return;
    }

    SpanContext parentContext = parentContextFromMap(mapReader, context);
    ReactSpanProperties spanProperties = propertiesFromMap(mapReader);

    if (spanProperties == null) {
      reportFailure(promise, "Export: missing name, start or end time");
      return;
    }

    Attributes attributes = attributesFromMap(mapReader.getAttributes());

    ReactSpanData spanData = new ReactSpanData(spanProperties, attributes, context, parentContext,
      Collections.emptyList());
    currentExporter.export(Collections.singleton(spanData));

    promise.resolve(null);
  }

  @ReactMethod
  public void setSessionId(String sessionId) {
    CrashReporter currentCrashReporter = crashReporter;

    if (currentCrashReporter != null) {
      currentCrashReporter.updateSessionId(sessionId);
    }
  }

  @ReactMethod
  public void setGlobalAttributes(ReadableMap attributeMap) {
    CrashReporter currentCrashReporter = crashReporter;

    if (currentCrashReporter != null) {
      currentCrashReporter.updateGlobalAttributes(attributesFromMap(attributeMap));
    }
  }

  @NonNull
  private SpanContext contextFromMap(SpanMapReader mapReader) {
    String traceId = mapReader.getTraceId();
    String spanId = mapReader.getSpanId();
    Long traceFlagsNumeric = mapReader.getTraceFlags();

    if (traceId == null || spanId == null) {
      return SpanContext.getInvalid();
    }

    TraceFlags traceFlags = traceFlagsNumeric != null ?
      TraceFlags.fromByte(traceFlagsNumeric.byteValue()) : TraceFlags.getSampled();

    return SpanContext.create(traceId, spanId, traceFlags, TraceState.getDefault());
  }

  @NonNull
  private SpanContext parentContextFromMap(SpanMapReader mapReader, SpanContext childContext) {
    String parentSpanId = mapReader.getParentSpanId();

    if (parentSpanId == null) {
      return SpanContext.getInvalid();
    }

    return SpanContext.create(childContext.getTraceId(), parentSpanId, childContext.getTraceFlags(),
      TraceState.getDefault());
  }

  private ReactSpanProperties propertiesFromMap(SpanMapReader mapReader) {
    String name = mapReader.getName();
    Long startEpochMillis = mapReader.getStartEpochMillis();
    Long endEpochMillis = mapReader.getEndEpochMillis();

    if (name == null || startEpochMillis == null || endEpochMillis == null) {
      return null;
    }

    return new ReactSpanProperties(
      name,
      SpanKind.INTERNAL,
      StatusData.ok(),
      millisToNanos(startEpochMillis),
      millisToNanos(endEpochMillis)
    );
  }

  @NonNull
  private Attributes attributesFromMap(@Nullable ReadableMap attributeMap) {
    if (attributeMap == null) {
      return Attributes.empty();
    }

    Iterator<Map.Entry<String, Object>> iterator = attributeMap.getEntryIterator();

    AttributesBuilder builder = Attributes.builder();

    while (iterator.hasNext()) {
      Map.Entry<String, Object> entry = iterator.next();
      Object value = entry.getValue();

      if (value instanceof String) {
        builder.put(entry.getKey(), (String) value);
      } else if (value instanceof Number) {
        builder.put(entry.getKey(), ((Number) value).doubleValue());
      }
    }

    return builder.build();
  }

  private static void reportFailure(Promise promise, String message) {
    Log.d("SplunkOtel", message);
    promise.reject("SplunkOtel Error", message);
  }

  private static long millisToNanos(long millis) {
    return millis * 1000000;
  }
}
