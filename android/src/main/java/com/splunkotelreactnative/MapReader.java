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
import com.facebook.react.bridge.ReadableType;

public abstract class MapReader {
  protected static class StringKey {
    private final String key;

    public StringKey(String key) {
      this.key = key;
    }

    public String get(ReadableMap map) {
      if (map.hasKey(key) && map.getType(key) == ReadableType.String) {
        return map.getString(key);
      } else {
        return null;
      }
    }
  }
  protected static class BooleanKey {
    private final String key;

    public BooleanKey(String key) {
      this.key = key;
    }

    public Boolean get(ReadableMap map) {
      if (map.hasKey(key) && map.getType(key) == ReadableType.Boolean) {
        return map.getBoolean(key);
      } else {
        return null;
      }
    }
  }

  protected static class NumberKey {
    private final String key;

    public NumberKey(String key) {
      this.key = key;
    }

    public Long getLong(ReadableMap map) {
      if (map.hasKey(key) && map.getType(key) == ReadableType.Number) {
        return (long) map.getDouble(key);
      } else {
        return null;
      }
    }
  }

  protected static class MapKey {
    private final String key;

    public MapKey(String key) {
      this.key = key;
    }

    public ReadableMap getMap(ReadableMap map) {
      if (map.hasKey(key) && map.getType(key) == ReadableType.Map) {
        return map.getMap(key);
      } else {
        return null;
      }
    }
  }
}
