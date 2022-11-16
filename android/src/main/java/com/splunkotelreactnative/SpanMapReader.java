package com.splunkotelreactnative;

import com.facebook.react.bridge.ReadableMap;

public class SpanMapReader extends MapReader {
  public final ReadableMap map;

  public SpanMapReader(ReadableMap map) {
    this.map = map;
  }

  public String getName() {
    return Keys.NAME.get(map);
  }

  public String getTraceId() {
    return Keys.TRACE_ID.get(map);
  }

  public Long getTraceFlags() {
    return Keys.TRACE_FLAGS.getLong(map);
  }

  public String getSpanId() {
    return Keys.SPAN_ID.get(map);
  }

  public String getParentSpanId() {
    return Keys.PARENT_SPAN_ID.get(map);
  }

  public Long getStartEpochMillis() {
    return Keys.START_TIME.getLong(map);
  }

  public Long getEndEpochMillis() {
    return Keys.END_TIME.getLong(map);
  }

  public ReadableMap getAttributes() {
    return Keys.ATTRIBUTES.getMap(map);
  }

  private interface Keys {
    StringKey NAME = new StringKey("name");
    StringKey TRACE_ID = new StringKey("traceId");
    NumberKey TRACE_FLAGS = new NumberKey("traceFlags");
    StringKey SPAN_ID = new StringKey("spanId");
    StringKey PARENT_SPAN_ID = new StringKey("parentSpanId");
    NumberKey START_TIME = new NumberKey("startTime");
    NumberKey END_TIME = new NumberKey("endTime");
    MapKey ATTRIBUTES = new MapKey("attributes");
  }
}
