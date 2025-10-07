package com.splunkotelreactnative.crash;

import android.content.Context;
import android.util.Log;

import com.splunkotelreactnative.ReactSpanData;
import com.splunkotelreactnative.ReactSpanProperties;
import com.splunkotelreactnative.exporter.network.CurrentNetwork;
import com.splunkotelreactnative.exporter.network.CurrentNetworkAttributesExtractor;
import com.splunkotelreactnative.exporter.network.CurrentNetworkProvider;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.common.AttributesBuilder;
import io.opentelemetry.api.internal.ImmutableSpanContext;
import io.opentelemetry.api.trace.SpanContext;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.TraceFlags;
import io.opentelemetry.api.trace.TraceState;
import io.opentelemetry.sdk.common.Clock;
import io.opentelemetry.sdk.trace.IdGenerator;
import io.opentelemetry.sdk.trace.SpanLimits;
import io.opentelemetry.sdk.trace.data.EventData;
import io.opentelemetry.sdk.trace.data.StatusData;
import io.opentelemetry.sdk.trace.export.SpanExporter;
import io.opentelemetry.sdk.trace.internal.data.ExceptionEventData;
import io.opentelemetry.semconv.trace.attributes.SemanticAttributes;

public class CrashReporter {
  private final SpanExporter exporter;
  private final CurrentNetworkProvider currentNetworkProvider;
  private volatile Attributes globalAttributes;
  private volatile String sessionId;
  private final RuntimeDetailsExtractor runtimeDetailsExtractor;
  private final AtomicBoolean crashHappened = new AtomicBoolean(false);
  private final AnchoredClock clock;
  private final IdGenerator idGenerator;

  public CrashReporter(SpanExporter exporter, CurrentNetworkProvider currentNetworkProvider, Attributes globalAttributes, Context context) {
    this.exporter = exporter;
    this.globalAttributes = globalAttributes;
    this.currentNetworkProvider = currentNetworkProvider;
    this.runtimeDetailsExtractor = RuntimeDetailsExtractor.create(context);
    this.clock = AnchoredClock.create(Clock.getDefault());
    this.idGenerator = IdGenerator.random();
  }

  public void updateSessionId(String sessionId) {
    this.sessionId = sessionId;
  }

  public void updateGlobalAttributes(Attributes globalAttributes) {
    this.globalAttributes = globalAttributes;
  }

  public void install() {
    Thread.UncaughtExceptionHandler existingHandler = Thread.getDefaultUncaughtExceptionHandler();

    Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
      exportCrashSpan(thread, throwable);
      exporter.flush();

      if (existingHandler != null) {
        existingHandler.uncaughtException(thread, throwable);
      }
    });
  }

  private void exportCrashSpan(Thread thread, Throwable exception) {
    long epochNanos = clock.now();

    ReactSpanProperties properties = buildProperties(exception, epochNanos);
    ReactSpanData spanData = new ReactSpanData(
      properties,
      buildAttributes(properties, thread),
      buildContext(),
      SpanContext.getInvalid(),
      buildEvents(exception, epochNanos));

    exporter.export(Collections.singletonList(spanData));
  }

  private SpanContext buildContext() {
    String spanId = idGenerator.generateSpanId();
    String traceId = idGenerator.generateTraceId();

    return ImmutableSpanContext.create(
      traceId, spanId, TraceFlags.getSampled(), TraceState.getDefault(), false, true);
  }

  private Attributes buildAttributes(ReactSpanProperties properties, Thread thread) {
    AttributesBuilder attributes = Attributes.builder().putAll(globalAttributes);
    attributes.put(CrashReporterAttributes.SPLUNK_OPERATION_KEY, properties.name);
    attributes.put(SemanticAttributes.THREAD_ID, thread.getId());
    attributes.put(SemanticAttributes.THREAD_NAME, thread.getName());
    attributes.put(SemanticAttributes.EXCEPTION_ESCAPED, true);

    attributes.put(CrashReporterAttributes.STORAGE_SPACE_FREE_KEY,
      runtimeDetailsExtractor.getCurrentStorageFreeSpaceInBytes());
    attributes.put(CrashReporterAttributes.HEAP_FREE_KEY,
      runtimeDetailsExtractor.getCurrentFreeHeapInBytes());

    String currentSessionId = sessionId;

    if (currentSessionId != null) {
      attributes.put("splunk.rumSessionId", currentSessionId);
    }

    Double currentBatteryPercent = runtimeDetailsExtractor.getCurrentBatteryPercent();
    if (currentBatteryPercent != null) {
      attributes.put(CrashReporterAttributes.BATTERY_PERCENT_KEY, currentBatteryPercent);
    }

    String component = crashHappened.compareAndSet(false, true)
      ? CrashReporterAttributes.COMPONENT_CRASH
      : CrashReporterAttributes.COMPONENT_ERROR;
    attributes.put(CrashReporterAttributes.COMPONENT_KEY, component);

    CurrentNetwork network = currentNetworkProvider.refreshNetworkStatus();
    CurrentNetworkAttributesExtractor networkAttributesExtractor = new CurrentNetworkAttributesExtractor();
    Attributes networkAttributes = networkAttributesExtractor.extract(network);
    attributes.putAll(networkAttributes);

    return attributes.build();
  }

  private List<EventData> buildEvents(Throwable exception, long epochNanos) {
    EventData event = ExceptionEventData
      .create(SpanLimits.getDefault(), epochNanos, exception, Attributes.empty());

    return Collections.singletonList(event);
  }

  private ReactSpanProperties buildProperties(Throwable exception, long epochNanos) {
    String name = exception.getClass().getSimpleName();

    return new ReactSpanProperties(
      name,
      SpanKind.INTERNAL,
      StatusData.error(),
      epochNanos,
      epochNanos
    );
  }
}
