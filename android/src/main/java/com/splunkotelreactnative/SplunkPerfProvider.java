package com.splunkotelreactnative;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class SplunkPerfProvider extends ContentProvider {

  private static final long appStartTime = System.currentTimeMillis();

  public static long getAppStartTime() {
    return appStartTime;
  }

  @Override
  public boolean onCreate() {
    Log.d("SplunkRNRum", "perfProvider onCreate: " + appStartTime);

    ActivityCallbacks activityCallbacks = new ActivityCallbacks();
    activityCallbacks.registerActivityLifecycleCallbacks(getContext());

    //TODO deregister callbacks?
    return false;
  }

  @Nullable
  @Override
  public Cursor query(@NonNull Uri uri, @Nullable String[] strings, @Nullable String s, @Nullable String[] strings1, @Nullable String s1) {
    return null;
  }

  @Nullable
  @Override
  public String getType(@NonNull Uri uri) {
    return null;
  }

  @Nullable
  @Override
  public Uri insert(@NonNull Uri uri, @Nullable ContentValues contentValues) {
    return null;
  }

  @Override
  public int delete(@NonNull Uri uri, @Nullable String s, @Nullable String[] strings) {
    return 0;
  }

  @Override
  public int update(@NonNull Uri uri, @Nullable ContentValues contentValues, @Nullable String s, @Nullable String[] strings) {
    return 0;
  }
}
