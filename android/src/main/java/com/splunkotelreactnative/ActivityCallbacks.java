package com.splunkotelreactnative;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class ActivityCallbacks implements Application.ActivityLifecycleCallbacks {
  private boolean isRegisteredForLifecycleCallbacks;

  public void registerActivityLifecycleCallbacks(Context context) {
    // Make sure the callback is registered only once.
    if (isRegisteredForLifecycleCallbacks) {
      return;
    }
    Context appContext = context.getApplicationContext();
    if (appContext instanceof Application) {
      ((Application) appContext).registerActivityLifecycleCallbacks(this);
      isRegisteredForLifecycleCallbacks = true;
    }
  }

  @Override
  public void onActivityCreated(@NonNull Activity activity, @Nullable Bundle savedInstanceState) {
    boolean isColdStart = savedInstanceState == null;
    Log.d("SplunkRNRum", "onActivityCreated: " + isColdStart);
    AppStartTracker.getInstance().setColdStart(isColdStart);
  }

  @Override
  public void onActivityStarted(@NonNull Activity activity) {
  }

  @Override
  public void onActivityResumed(@NonNull Activity activity) {
    String simpleName = activity.getClass().getSimpleName();
    Log.d("SplunkRNRum", "onActivityResumed: " + simpleName);
  }

  @Override
  public void onActivityPaused(@NonNull Activity activity) {
  }

  @Override
  public void onActivityStopped(@NonNull Activity activity) {

  }

  @Override
  public void onActivitySaveInstanceState(@NonNull Activity activity, @NonNull Bundle outState) {

  }

  @Override
  public void onActivityDestroyed(@NonNull Activity activity) {
  }
}
