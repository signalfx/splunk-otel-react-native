# iOS Background-Launch Cold-Start Simulation (React Native)

This reproduces the issue from the Confluence design
["iOS App Start Measurement for React Native Background Launches"](https://splunk.atlassian.net/wiki/spaces/PROD/pages/1080301093213):
when iOS launches the process in the background (silent push, background fetch) and
the user foregrounds it much later, the native `AppStartHandler` anchors a **cold
start at the BSD process-start time**, so the whole background-residence window is
reported as user-visible cold-start latency.

## What was added to the example app

- `ios/SplunkOtelReactNativeExample/Info.plist` — `UIBackgroundModes` with
  `remote-notification` and `fetch`.
- `ios/SplunkOtelReactNativeExample/AppDelegate.swift` — a `BackgroundLaunchProbe`
  that logs the real BSD process-start time (the SDK's cold anchor), lifecycle
  timings, and the `process-start -> didBecomeActive` delta; plus silent-push and
  background-fetch handlers.
- `ios/silent-push.apns` — a `content-available: 1` payload for `simctl push`.
- `src/App.tsx` — a `SPLUNK_INSTALL_DELAY_SECONDS` hook that delays mounting
  `SplunkRumProvider` (and therefore `SplunkRum.install()` / `trackAppStart()`).

Debug logging is already enabled (`config.ts` -> `enableDebugLogging: true`), so the
native SDK logs the emitted `AppStart` span (`start.type` + duration).

## Why the cold start inflates

`AppStartHandler.setUp()` runs from a C `__attribute__((constructor))` before JS, so
`didFinishLaunching` (and, on a real background launch, the late `didBecomeActive`) are
captured natively. `SplunkRum.install()` runs from JS and immediately calls
`AppStartHandler.shared.trackAppStart()`. Per the design doc (section 3.4) the manual
`appStart.track(...)` path completes the span at the moment JS invokes tracking. So the
`AppStart` span spans `process start -> install`, anchored at BSD process start and
classified `cold`.

## Three ways to reproduce on a REAL DEVICE

### Option A — Install delay (easiest, deterministic, no APNs)

Delays JS install so the `process-start -> install` gap inflates. Works identically on
device and Simulator.

```bash
cd example
SPLUNK_INSTALL_DELAY_SECONDS=25 \
SPLUNK_REALM=<realm> SPLUNK_RUM_ACCESS_TOKEN=<token> \
yarn ios --device "<Your iPhone>"
```

Expected: a `cold` `AppStart` span of ~25s even though the app became active in <1s.

> Note: `SPLUNK_INSTALL_DELAY_SECONDS` is inlined at build time by
> `transform-inline-environment-variables`. If you change it, rebuild the JS bundle
> (restart Metro / rebuild the app), don't just fast-refresh.

### Option B — Background fetch via Xcode (real background launch, no APNs)

1. Open `ios/SplunkOtelReactNativeExample.xcworkspace` in Xcode and run on the device.
2. Product > Scheme > Edit Scheme > Run > Options: check **"Launch due to a background
   fetch event"**.
3. Run. The app cold-launches directly into the background (`performFetch` fires,
   `didBecomeActive` does not). Watch for `[BG-LAUNCH-PROBE] performFetch ... applicationState=background`.
4. After a while, tap the app icon to foreground it. `didBecomeActive` fires and the
   `AppStart` span is emitted.

### Option C — Genuine silent push (real background launch, needs APNs)

1. Add the Push Notifications capability (an `aps-environment` entitlement) to the
   Runner target and provision the device.
2. Send a background push with `{"aps":{"content-available":1}}` and header
   `apns-push-type: background` using your APNs auth key (e.g. via a small script or a
   tool like Pusher/NWPusher).
3. Deliver it while the app is not running to cold-launch it in the background, wait,
   then foreground.

## Simulator smoke test (limited)

`xcrun simctl push` delivers the notification but does **not** cold-launch a terminated
app into the background, so it will not inflate the cold start. Use Option A on the
Simulator instead. The helper script is provided for convenience:

```bash
cd example
tool/simulate_background_launch.sh booted splunkotelreactnative.example 30
```

## Observing the result

- Device logs (Console.app or `idevicesyslog`): filter for `[BG-LAUNCH-PROBE]` and the
  `com.splunk.rum` AppStart / OpenTelemetry span output.
- Splunk RUM: the `AppStart` span (`component=appstart`); check `start.type` and
  `duration`.
