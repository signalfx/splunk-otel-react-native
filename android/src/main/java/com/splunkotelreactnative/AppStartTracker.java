package com.splunkotelreactnative;

import org.jetbrains.annotations.NotNull;

public class AppStartTracker {
  private static final @NotNull AppStartTracker instance = new AppStartTracker();

  private boolean isColdStart = false;

  public static @NotNull AppStartTracker getInstance() {
    return instance;
  }

  public boolean isColdStart() {
    return isColdStart;
  }

  public void setColdStart(boolean coldStart) {
    isColdStart = coldStart;
  }
}
