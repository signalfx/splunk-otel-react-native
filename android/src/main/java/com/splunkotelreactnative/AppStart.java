package com.splunkotelreactnative;

public class AppStart {
    long startTime;
    String type;

    public void setStartTime(long currentTimeMillis) {
      startTime = currentTimeMillis;
    }

    public void setType(String type) {
      this.type = type;
    }
}
