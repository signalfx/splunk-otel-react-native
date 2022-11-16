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

  private interface Keys {
    StringKey BEACON_ENDPOINT = new StringKey("beaconEndpoint");
    StringKey RUM_ACCESS_TOKEN = new StringKey("rumAccessToken");
  }
}
