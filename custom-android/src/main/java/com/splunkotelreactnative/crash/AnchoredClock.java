package com.splunkotelreactnative.crash;

import io.opentelemetry.sdk.common.Clock;

// copied from otel-java
final class AnchoredClock {
  private final Clock clock;
  private final long epochNanos;
  private final long nanoTime;

  private AnchoredClock(Clock clock, long epochNanos, long nanoTime) {
    this.clock = clock;
    this.epochNanos = epochNanos;
    this.nanoTime = nanoTime;
  }

  public static AnchoredClock create(Clock clock) {
    return new AnchoredClock(clock, clock.now(), clock.nanoTime());
  }

  long now() {
    long deltaNanos = this.clock.nanoTime() - this.nanoTime;
    return this.epochNanos + deltaNanos;
  }
}
