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
