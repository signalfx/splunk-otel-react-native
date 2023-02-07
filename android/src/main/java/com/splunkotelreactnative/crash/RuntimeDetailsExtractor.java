package com.splunkotelreactnative.crash;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;

import androidx.annotation.Nullable;

import java.io.File;

// partial copy of splunk-otel-android
final class RuntimeDetailsExtractor extends BroadcastReceiver {
  private @Nullable volatile Double batteryPercent = null;
  private final File filesDir;

  static RuntimeDetailsExtractor create(Context context) {
    IntentFilter batteryChangedFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
    File filesDir = context.getFilesDir();
    RuntimeDetailsExtractor runtimeDetails = new RuntimeDetailsExtractor(filesDir);
    context.registerReceiver(runtimeDetails, batteryChangedFilter);
    return runtimeDetails;
  }

  private RuntimeDetailsExtractor(File filesDir) {
    this.filesDir = filesDir;
  }

  @Override
  public void onReceive(Context context, Intent intent) {
    int level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
    int scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
    batteryPercent = level * 100.0d / (float) scale;
  }

  long getCurrentStorageFreeSpaceInBytes() {
    return filesDir.getFreeSpace();
  }

  long getCurrentFreeHeapInBytes() {
    Runtime runtime = Runtime.getRuntime();
    return runtime.freeMemory();
  }

  @Nullable
  Double getCurrentBatteryPercent() {
    return batteryPercent;
  }
}

