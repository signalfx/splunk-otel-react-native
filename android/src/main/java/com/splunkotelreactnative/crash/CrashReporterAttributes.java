package com.splunkotelreactnative.crash;

import static io.opentelemetry.api.common.AttributeKey.doubleKey;
import static io.opentelemetry.api.common.AttributeKey.longKey;

import io.opentelemetry.api.common.AttributeKey;

// copied from splunk-otel-android SplunkRum class
class CrashReporterAttributes {
  static final AttributeKey<Long> STORAGE_SPACE_FREE_KEY = longKey("storage.free");
  static final AttributeKey<Long> HEAP_FREE_KEY = longKey("heap.free");
  static final AttributeKey<Double> BATTERY_PERCENT_KEY = doubleKey("battery.percent");
  static final AttributeKey<String> COMPONENT_KEY = AttributeKey.stringKey("component");

  static final String COMPONENT_CRASH = "crash";
  static final String COMPONENT_ERROR = "error";
}
