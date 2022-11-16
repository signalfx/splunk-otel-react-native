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
