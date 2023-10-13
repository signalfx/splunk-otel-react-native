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

public class ConfigMapReader extends MapReader {
  private static final boolean DEFAULT_DISK_CACHING_ENABLED = false;
  private static final int DEFAULT_MAX_STORAGE_USE_MB = 25;
  private final ReadableMap map;

  public ConfigMapReader(ReadableMap map) {
    this.map = map;
  }

  public String getBeaconEndpoint() {
    return Keys.BEACON_ENDPOINT.get(map);
  }

  public String getRumAccessToken() {
    return Keys.RUM_ACCESS_TOKEN.get(map);
  }

  public boolean getDiskCachingEnabled() {
    Boolean value = Keys.ENABLE_DISK_CACHING.get(map);
    return value != null ? value : DEFAULT_DISK_CACHING_ENABLED;
  }

  public int getMaxStorageUseMb() {
    Long value = Keys.MAX_STORAGE_USE_MB.getLong(map);
    return value != null ? value.intValue() : DEFAULT_MAX_STORAGE_USE_MB;
  }

  public ReadableMap getGlobalAttributes() {
    return ConfigMapReader.Keys.GLOBAL_ATTRIBUTES.getMap(map);
  }

  private interface Keys {
    StringKey BEACON_ENDPOINT = new StringKey("beaconEndpoint");
    StringKey RUM_ACCESS_TOKEN = new StringKey("rumAccessToken");
    BooleanKey ENABLE_DISK_CACHING = new BooleanKey("enableDiskCaching");

    NumberKey MAX_STORAGE_USE_MB = new NumberKey("maxStorageUseMb");
    MapKey GLOBAL_ATTRIBUTES = new MapKey("globalAttributes");
  }
}
