# Manual test protocol: React Native fatal crash delivery

This protocol validates the production fatal path without relying on an
example-only diagnostics panel or SDK-internal storage files.

Run these cases only with a Release build. Development builds report global
errors through the ordinary asynchronous error path and do not exercise the
bounded fatal persistence and native suppression contract.

## Case A: unhandled JavaScript fatal

1. Install and launch the Release/Hermes example.
2. Tap **Unhandled JS Error**.
3. Confirm that the application terminates.
4. Relaunch the application so iOS can inspect its pending PLCrashReporter
   report and so either platform can resume queued uploads.
5. Inspect device logs and MON0.

Expected result:

- MON0 contains exactly one `SplunkCrashReport` with `component=crash`,
  `error.is_fatal=true`, the raw JavaScript stack in
  `exception.stacktrace`, and the embedded source-map identity.
- MON0 contains no second native crash for the same fatal error.
- Android logs `Suppressed duplicate React Native fatal crash event` before
  delegating to the previous uncaught-exception handler.
- iOS logs `Suppressed native duplicate of a durably persisted React Native
  fatal crash.` during the next launch.

The JavaScript crash may reach MON0 before relaunch. The blocking native API
waits for local persistence, not network delivery; the normal exporter can
still complete an upload during the short interval before process termination.

## Case B: true native crash

1. Launch the Release example.
2. Tap **Simulate Native Crash** and confirm the prompt.
3. Relaunch after termination.
4. Inspect MON0.

Expected result:

- MON0 contains one native crash.
- No React Native fatal event was created.
- The crash is not suppressed because it has no matching React Native marker.

## Useful log filters

Android:

```bash
adb logcat | grep -iE "ReactNativeFatal|Suppressed duplicate|AndroidRuntime|SplunkCrashReport"
```

iOS simulator:

```bash
xcrun simctl spawn booted log stream \
  --predicate 'eventMessage CONTAINS[c] "React Native fatal" OR eventMessage CONTAINS[c] "SplunkCrashReport"'
```

## Pass criteria

| Platform | React Native fatal events | Duplicate native events | True native crash events |
| --- | ---: | ---: | ---: |
| Android Release | 1 | 0 | 1 in Case B only |
| iOS Release | 1 | 0 | 1 in Case B only |
