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

  public ReadableMap getGlobalAttributes() {
    return ConfigMapReader.Keys.GLOBAL_ATTRIBUTES.getMap(map);
  }

  private interface Keys {
    StringKey BEACON_ENDPOINT = new StringKey("beaconEndpoint");
    StringKey RUM_ACCESS_TOKEN = new StringKey("rumAccessToken");
    MapKey GLOBAL_ATTRIBUTES = new MapKey("globalAttributes");
  }
}
