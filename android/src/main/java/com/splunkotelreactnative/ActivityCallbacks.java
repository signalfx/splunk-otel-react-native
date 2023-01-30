package com.splunkotelreactnative;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.concurrent.atomic.AtomicReference;

public class ActivityCallbacks implements Application.ActivityLifecycleCallbacks {

  private AtomicReference<String> initialAppActivity;
  private AppStart appStart;

  public ActivityCallbacks(AtomicReference<String>  initialAppActivity, AppStart appStart) {
    this.initialAppActivity = initialAppActivity;
    this.appStart = appStart;
  }

  @Override
  public void onActivityCreated(@NonNull Activity activity, @Nullable Bundle savedInstanceState) {
    initialAppActivity.set("TODO");
    Log.d("ActivityCallbacks", "onActivityCreated");
    if (savedInstanceState == null) {
      appStart.setType("cold");
    } else {
      appStart.setType("warm");
    }
  }

  @Override
  public void onActivityStarted(@NonNull Activity activity) {
    Log.d("ActivityCallbacks", "onActivityStarted");
  }

  @Override
  public void onActivityResumed(@NonNull Activity activity) {
    Log.d("ActivityCallbacks", "onActivityResumed");
  }

  @Override
  public void onActivityPaused(@NonNull Activity activity) {
    Log.d("ActivityCallbacks", "onActivityPaused");
  }

  @Override
  public void onActivityStopped(@NonNull Activity activity) {
    Log.d("ActivityCallbacks", "onActivityStopped");
  }

  @Override
  public void onActivitySaveInstanceState(@NonNull Activity activity, @NonNull Bundle bundle) {
    Log.d("ActivityCallbacks", "onActivitySaveInstanceState");
  }

  @Override
  public void onActivityDestroyed(@NonNull Activity activity) {
    Log.d("ActivityCallbacks", "onActivityDestroyed");
  }
}
