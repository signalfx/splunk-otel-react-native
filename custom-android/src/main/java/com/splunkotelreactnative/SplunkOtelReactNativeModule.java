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

import static io.opentelemetry.context.Context.root;

import android.app.Application;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.splunk.rum.SplunkRum;
import com.splunk.rum.SplunkRumBuilder;

import java.util.Collections;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.common.AttributesBuilder;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanBuilder;
import io.opentelemetry.api.trace.SpanContext;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.TraceFlags;
import io.opentelemetry.api.trace.TraceState;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.context.Scope;
import io.opentelemetry.sdk.trace.data.StatusData;

@ReactModule(name = SplunkOtelReactNativeModule.NAME)
public class SplunkOtelReactNativeModule extends ReactContextBaseJavaModule {
  public static final String NAME = "SplunkOtelReactNative";

  private final long moduleStartTime;
  private final Application application;
  private SplunkRum splunkRum;

  public SplunkOtelReactNativeModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.application = (Application) reactContext.getApplicationContext();
    this.moduleStartTime = System.currentTimeMillis();
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void initialize(ReadableMap configMap, Promise promise) {
    Log.d("SplunkOtel", "Hello from custom SplunkOtelReactNativeModule");
    ConfigMapReader mapReader = new ConfigMapReader(configMap);
    String beaconEndpoint = mapReader.getBeaconEndpoint();
    String accessToken = mapReader.getRumAccessToken();

    if (beaconEndpoint == null || accessToken == null) {
      reportFailure(promise, "Initialize: cannot construct exporter, endpoint or token missing");
      return;
    }
    SplunkRumBuilder builder = SplunkRum.builder();

    builder.setBeaconEndpoint(beaconEndpoint);
    builder.setRumAccessToken(accessToken);
    builder.setApplicationName("AndroidSdkRnTestApp");
    builder.enableDebug();
    builder.enableDiskBuffering();
    builder.setDeploymentEnvironment("dev");
    builder.disableSlowRenderingDetection(); //if true crashes app right now
    builder.enableReactNativeSupport();
    splunkRum = builder.build(this.application);


    WritableMap appStartInfo = Arguments.createMap();
    double appStart = (double) SplunkPerfProvider.getAppStartTime();
    AppStartTracker appStartTracker = AppStartTracker.getInstance();
    appStartInfo.putDouble("appStart", appStart);
    appStartInfo.putDouble("moduleStart", (double) this.moduleStartTime);
    appStartInfo.putBoolean("isColdStart", appStartTracker.isColdStart());
    promise.resolve(appStartInfo);
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
    SpanMapReader mapReader = new SpanMapReader(spanMap);
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

    if (splunkRum != null) {
      Log.d("splunkRUMRN", "Exporting span w name: " + spanProperties.name);
      Tracer tracer = splunkRum.getOpenTelemetry().getTracer("splunk-rn-android");

      try (Scope ignored = Span.wrap(parentContext).storeInContext(root()).makeCurrent()) {
        SpanBuilder builder = tracer.spanBuilder(spanProperties.name);
        Span span = builder.setStartTimestamp(spanProperties.startEpochNanos, TimeUnit.NANOSECONDS)
          .startSpan();

        span.setAllAttributes(attributes);
        // Android SDK will remove prefixed attributes and override IDs with them
        span.setAttribute("_reactnative_spanId", context.getSpanId());
        span.setAttribute("_reactnative_traceId", context.getTraceId());
        span.setAttribute("isRNSpan", true);

        span.end(spanProperties.endEpochNanos, TimeUnit.NANOSECONDS);
      }
    }

    promise.resolve(null);
  }

  @ReactMethod
  public void setSessionId(String sessionId) {
//    CrashReporter currentCrashReporter = crashReporter;
//
//    if (currentCrashReporter != null) {
//      currentCrashReporter.updateSessionId(sessionId);
//    }
  }

  @ReactMethod
  public void setGlobalAttributes(ReadableMap attributeMap) {
//    CrashReporter currentCrashReporter = crashReporter;
//
//    if (currentCrashReporter != null) {
//      currentCrashReporter.updateGlobalAttributes(attributesFromMap(attributeMap));
//    }
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
