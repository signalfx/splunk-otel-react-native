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

import android.app.Application;
import android.content.ContextWrapper;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.splunkotelreactnative.crash.CrashEventAttributeExtractor;
import com.splunkotelreactnative.crash.CrashReporter;
import com.splunkotelreactnative.exporter.disk.DiskBufferingExporterFactory;
import com.splunkotelreactnative.exporter.network.CurrentNetwork;
import com.splunkotelreactnative.exporter.network.CurrentNetworkAttributesExtractor;
import com.splunkotelreactnative.exporter.network.CurrentNetworkProvider;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.common.AttributesBuilder;
import io.opentelemetry.api.trace.SpanContext;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.TraceFlags;
import io.opentelemetry.api.trace.TraceState;
import io.opentelemetry.exporter.zipkin.ZipkinSpanExporterBuilder;
import io.opentelemetry.sdk.trace.data.SpanData;
import io.opentelemetry.sdk.trace.data.StatusData;
import io.opentelemetry.sdk.trace.export.SpanExporter;

@ReactModule(name = SplunkOtelReactNativeModule.NAME)
public class SplunkOtelReactNativeModule extends ReactContextBaseJavaModule {
  public static final String NAME = "SplunkOtelReactNative";

  private final long moduleStartTime;
  private volatile SpanExporter exporter;
  private volatile CrashReporter crashReporter;
  private CurrentNetworkProvider currentNetworkProvider;

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

    if (beaconEndpoint == null || accessToken == null) {
      reportFailure(promise, "Initialize: cannot construct exporter, endpoint or token missing");
      return;
    }

    String endpointWithAuthentication = beaconEndpoint + "?auth=" + accessToken;

    currentNetworkProvider = CurrentNetworkProvider.createAndStart((Application) getReactApplicationContext().getApplicationContext());

    exporter = createExporter(endpointWithAuthentication, getReactApplicationContext(),
      mapReader.getEnableDiskBuffering(), mapReader.getMaxStorageUseMb());

    crashReporter = new CrashReporter(exporter, currentNetworkProvider,
      attributesFromMap(mapReader.getGlobalAttributes()), getReactApplicationContext());

    crashReporter.install();

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
  public void export(ReadableArray spanMaps, Promise promise) {
    SpanExporter currentExporter = exporter;

    if (currentExporter == null) {
      reportFailure(promise, "Export: exporter not initialized");
      return;
    }

    List<SpanData> spanDataList = new ArrayList<>();

    CurrentNetwork network = currentNetworkProvider.refreshNetworkStatus();
    CurrentNetworkAttributesExtractor networkAttributesExtractor = new CurrentNetworkAttributesExtractor();
    Attributes networkAttributes = networkAttributesExtractor.extract(network);

    for (int i = 0; i < spanMaps.size(); i++) {
      ReadableMap spanMap = spanMaps.getMap(i);
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

      Attributes attributes = attributesFromMap(mapReader.getAttributes()).toBuilder().putAll(networkAttributes).build();
      ReactSpanData spanData = new ReactSpanData(spanProperties, attributes, context, parentContext,
        Collections.emptyList());

      spanDataList.add(spanData);
    }

    currentExporter.export(spanDataList);

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
    Attributes attributesFromMap = attributesFromMap(attributeMap);
    setGlobalAttributes(attributesFromMap);
  }

  private void setGlobalAttributes(Attributes attributes) {
    CrashReporter currentCrashReporter = crashReporter;

    if (currentCrashReporter != null) {
      currentCrashReporter.updateGlobalAttributes(attributes);
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
  private SpanExporter createExporter(String endpoint, ContextWrapper application,
                                      boolean enableDiskBuffering, int maxStorageUseMb) {
    if (!enableDiskBuffering) {
      return new CrashEventAttributeExtractor(new ZipkinSpanExporterBuilder()
        .setEndpoint(endpoint)
        .setEncoder(new CustomZipkinEncoder())
        .build());
    }
    return DiskBufferingExporterFactory.setupDiskBuffering(endpoint, application, maxStorageUseMb, currentNetworkProvider);
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
        // TODO fix this
        if (entry.getKey().equals("http.status_code")) {
          builder.put(entry.getKey(), ((Number) value).intValue());
        } else {
          builder.put(entry.getKey(), ((Number) value).doubleValue());
        }
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
