# Automatic JavaScript Error Reporting — React Native Agent

> **Design update — 2026-08-02:** The current target contract is documented in
> [`../../doc/react-native/react-native-source-map-and-error-event-design-decisions.md`](../../doc/react-native/react-native-source-map-and-error-event-design-decisions.md).
> Earlier references below to agent-formatted `exception.stacktrace` and reuse
> of generic native exception tracking are superseded. The target sends the raw
> stack once in `error.stack` through dedicated Android/iOS error-event APIs;
> backend processing owns parsing, coordinate conversion, and normalization.
> The runtime engine selects Hermes or JSC coordinate semantics; the wire
> contract does not carry a redundant coordinate-system or code-bundle field.

## Overview

The React Native agent automatically captures three categories of JavaScript errors without any instrumentation code in the app. All errors are reported as OTel spans through the existing `customTrackError` native bridge method and appear in the **Errors** section of Splunk Observability.

Each error span carries a set of extra attributes that allow backend queries and the UI to distinguish error origin, severity, and capture mechanism — enabling experiences like "show me all fatal JS crashes" or "filter to only unhandled promise rejections".

---

## Error Types and Capture Mechanisms

### 1. Unhandled JS Exception (Fatal or Non-Fatal)

**What it captures:** Any JavaScript exception that escapes all try/catch blocks and reaches the React Native runtime. This includes:
- Uncaught exceptions thrown from event handlers, timers, or bridge callbacks
- Errors thrown inside `useEffect`, native event callbacks, or third-party library code
- A fatal error explicitly raised via `ErrorUtils.reportFatalError()`

**How it works:** We hook into `ErrorUtils.setGlobalHandler()` — the same internal RN API that the default red screen / crash dialog uses. Our handler runs first, reports the span, then chains to the previous handler so RN's default behavior is preserved.

**Fatal path (release builds only):** On a fatal error in a release build the app is about to terminate. We defer calling the previous handler (which triggers the OS crash) for up to **2000ms** so the span has time to cross the bridge:
- Up to 1500ms to wait for `trackError` to complete across the JS→native bridge
- Up to 500ms to wait for `nativeForceFlush()` to drain Android's `BatchSpanProcessor` to disk
- 50ms post-flush pause for the native layer to finish recording

In development builds (`__DEV__ === true`) the fatal path is skipped — the previous handler is invoked immediately and the red screen appears normally.

**Attributes:**

| Attribute | Value | Notes |
|---|---|---|
| `error.layer` | `javascript` | All JS-originated errors carry this |
| `error.type` | `js_exception` | Distinguishes from promise rejections and render errors |
| `exception.escaped` | `true` | The error propagated beyond all catch blocks |
| `error.capture` | `globalHandler` | Capture mechanism used |
| `error.is_fatal` | `true` / `false` | Whether RN classified this as a fatal error |
| `exception.type` | e.g. `TypeError` | JS `Error.name` value |
| `exception.stacktrace` | Full JS stack | Formatted by `formatJsErrorStack`, Hermes-aware |

---

### 2. Unhandled Promise Rejection

**What it captures:** Any `Promise` that is rejected and has no `.catch()` handler or `try/await/catch` block.

**How it works:** Two paths depending on the JS engine:

- **Hermes** (default since RN 0.70, used on both Android and iOS in release builds): We call `HermesInternal.enablePromiseRejectionTracker()` — the same internal API RN itself calls during bootstrap. This replaces RN's default dev-only handler with ours while chaining to it.
- **JSC** (older apps, custom builds): We call `promise/setimmediate/rejection-tracking`'s `enable()` API, which is the JS-layer promise tracker backed by the non-native Promise polyfill.

In both cases RN's previous `onUnhandled`/`onHandled` callbacks are chained, so LogBox warnings in development still work.

**Attributes:**

| Attribute | Value | Notes |
|---|---|---|
| `error.layer` | `javascript` | |
| `error.type` | `js_unhandled_promise_rejection` | |
| `exception.escaped` | `true` | The rejection was never caught |
| `error.capture` | `unhandledPromiseRejection` | |
| `exception.type` | e.g. `Error` | JS `Error.name` if the rejection was an Error object |
| `exception.stacktrace` | Full JS stack | If the rejection was an Error with a stack |

---

### 3. React Error Boundary (Render / Lifecycle Error)

**What it captures:** JavaScript exceptions thrown during React component render, `constructor`, or lifecycle methods (`getDerivedStateFromProps`, `componentDidUpdate`, etc.) that are wrapped in a `SplunkErrorBoundary`.

**How it works:** React Error Boundaries are class components that implement `componentDidCatch`. Errors caught here **never** reach `ErrorUtils` — React recovers them internally and keeps the app running. The boundary is the only mechanism that can observe these errors. We provide:

- `SplunkErrorBoundary` — a drop-in class component with `fallback` (static or function) and `onError` props
- `withSplunkErrorBoundary(Component, boundaryProps?)` — a HOC for wrapping components where you can't modify JSX

Unlike the other two categories, the app **does not crash** here — the boundary catches the error, renders the fallback UI, and the session continues.

**Usage:**

```tsx
// Wrap a subtree
<SplunkErrorBoundary fallback={<ErrorScreen />}>
  <MyFeature />
</SplunkErrorBoundary>

// Or wrap a component
const SafeFeature = withSplunkErrorBoundary(MyFeature, {
  fallback: (err) => <Text>Feature error: {err.message}</Text>
});
```

**Attributes:**

| Attribute | Value | Notes |
|---|---|---|
| `error.layer` | `javascript` | |
| `error.type` | `react_render_error` | |
| `exception.escaped` | `false` | The boundary caught it; app survived |
| `error.capture` | `errorBoundary` | |
| `error.component_stack` | React component trace | e.g. `\n  in MyFeature\n  in SplunkErrorBoundary` |
| `exception.type` | e.g. `TypeError` | JS `Error.name` |
| `exception.stacktrace` | Full JS stack | |

---

## Common Attributes Across All Types

All three error types automatically include these through `CustomTracking.trackError`:

| Attribute | Source | Notes |
|---|---|---|
| `error.layer` | `javascript` | Set by default; distinguishes from native crashes which have no this attribute |
| `component` | `error` | Set by the native Android/iOS SDK; all custom-tracked errors get `component=error` |
| `error` | `true` | Set by the native SDK; marks span as an error span |
| `exception.type` | `Error.name` | e.g. `TypeError`, `ReferenceError`, `Error` |
| `exception.stacktrace` | Formatted JS stack | Built by `formatJsErrorStack` using RN's `parseErrorStack`, which is Hermes-aware |

---

## Differentiating Error Types in Queries

Because all attributes are present on every span, the full error picture can be assembled with attribute filters. Example SPL-style queries:

```
# All JS errors
component=error AND error.layer=javascript

# Only fatal JS crashes (the app died)
component=error AND error.layer=javascript AND error.is_fatal=true

# Only promise rejections
component=error AND error.type=js_unhandled_promise_rejection

# Only React render errors (app survived)
component=error AND error.type=react_render_error AND exception.escaped=false

# Non-fatal JS errors across all types
component=error AND error.layer=javascript AND error.is_fatal=false
```

---

## What It Would Take to Report JS Errors as Crashes

Currently all JS errors land in the **Errors** section (`component=error`) rather than the **Crashes** section (`component=crash`). This is because the native bridge only exposes `customTrackError`, which always produces `component=error` spans.

For a fatal JS error (`error.is_fatal=true`) the app terminates the same way a native crash does, so semantically `component=crash` would also be accurate. Showing it in the Crash tab would give it first-class visibility alongside native crashes. However it requires native SDK changes on both platforms:

### What needs to change

**1. New native bridge method (both platforms)**

A new method `customTrackCrash(message, attributes)` that mirrors `customTrackError` but sets `component=crash` instead of `component=error` at the span-building layer.

On **Android** ([CustomTrackingHandler.kt](../packages/core/android/src/main/kotlin/com/splunk/otel/reactnative/CustomTrackingHandler.kt)):
- The current `trackError` path calls `CustomTracking.instance.trackException()` which hardcodes `COMPONENT_ERROR`
- A `trackCrash` method would need to call a lower-level span builder that sets `COMPONENT_CRASH`
- This may require a new method on the `CustomTracking` class in `splunk-otel-android`

On **iOS** ([CustomTrackingHandler.swift](../packages/core/ios/)):
- The current `trackError` path calls `customTrackingHandler.trackError()`
- A crash path would need to emit `component=crash` at the `CustomTrackingData` level

**2. TurboModule spec update** ([NativeSplunkOtelReactNative.ts](../packages/core/src/specs/NativeSplunkOtelReactNative.ts)):
- Add `customTrackCrash(message: string, attributes: {...}): Promise<void>`

**3. JS-side routing** ([JsErrorHandler.ts](../packages/core/src/instrumentation/JsErrorHandler.ts)):
- When `error.is_fatal=true`, call `nativeTrackCrash()` instead of `customTrackError()`

**4. Backend/UI consideration**

The Crash tab typically shows one span per session (the fatal event). If both a native crash span and a JS crash span exist for the same session, the UI needs to handle that gracefully — either coalescing them or showing both. This is a product decision that should be agreed before implementation.

### Recommended approach

For the short term, the `error.is_fatal=true` attribute on spans in the Errors section is sufficient to surface fatal JS errors distinctly. The UI can add a "JS Fatal" label/filter using this attribute without touching the crash pipeline.

Promoting to `component=crash` is a larger cross-team change (Android SDK, iOS SDK, RN bridge, UI) and should be planned as a separate feature once the error reporting baseline is validated in production.

---

## Architecture Summary

```
React Native App
       │
       ├── Unhandled JS Exception
       │       └── ErrorUtils global handler (our hook)
       │               ├── Fatal in release → defer 2000ms → trackError → nativeForceFlush → chain to RN
       │               └── Non-fatal / dev → trackError (fire-and-forget) → chain to RN
       │
       ├── Unhandled Promise Rejection
       │       ├── Hermes → HermesInternal.enablePromiseRejectionTracker (our hook)
       │       └── JSC   → promise/setimmediate/rejection-tracking (our hook)
       │               └── onUnhandled → trackError (fire-and-forget)
       │
       └── React Render / Lifecycle Error
               └── <SplunkErrorBoundary> componentDidCatch
                       └── trackError (fire-and-forget, app survives)
                               │
                               ▼
                   CustomTracking.trackError(message, attributes)
                               │
                               ▼
                   Native bridge → customTrackError
                               │
                       ┌───────┴────────┐
                       │                │
                  Android              iOS
              trackException()      trackError()
              component=error       component=error
                       │                │
                       └───────┬────────┘
                               ▼
                    Splunk RUM ingest → Errors tab
```

---

## Known Issue: Native Bridge Attribute Conflicts

### Problem

The JS → native pipeline passes two things to the native error tracking APIs: a `message` string and an `attributes` map (which already contains `exception.type`, `exception.stacktrace`, etc. set correctly by the JS layer). However, both platforms use error-tracking APIs designed for native exceptions, and those APIs re-derive some of the same attributes from their own internal logic, overwriting what we sent.

#### Android

The RN bridge calls `CustomTracking.trackException(JsReportedException(message), attrs)`.

**Issue 1 — Span name is wrong.** `trackException()` uses `throwable.javaClass.simpleName` as the span name. This hardcodes the span name to `"JsReportedException"` in the Errors tab instead of the actual JS error type (e.g. `TypeError`, `ReferenceError`).

**Issue 2 — `exception.type` is overwritten.** OTel's `span.recordException(throwable)` internally sets `exception.type` to the Java class name of the throwable — again `"JsReportedException"` — overriding the correct JS value we passed in (e.g. `"TypeError"`).

**Issue 3 — `exception.stacktrace` conflict risk.** `recordException()` also writes `exception.stacktrace` from the throwable. The `JsReportedException` is constructed with `writableStackTrace = false` so it has no Java frames, which avoids polluting the stacktrace with Java frames. However the attribute order between `setAllAttributes(attrs)` (our JS stacktrace) and `recordException()` (empty native stacktrace) determines which value wins — this is fragile and depends on OTel SDK internals.

#### iOS

The RN bridge calls `SplunkRum.shared.customTracking.trackError(message, attrs)` which internally wraps the message string as `SplunkIssue(from: message)`.

**Issue — `exception.type` is always `"String"`.** `SplunkIssue(from: message)` sets `exceptionType = String(describing: type(of: message))`, which evaluates to the Swift type name `"String"` regardless of the actual JS error type we passed in `exception.type`. Our attribute is then merged but the `SplunkIssue` value takes precedence.

Note: `SplunkIssue(from: message)` correctly sets `stacktrace = nil`, so no native call stack is injected — the JS stacktrace we pass through attributes is the only one present. This part is fine.

### Fix Plan

The root cause on both platforms is using exception/throwable-oriented APIs that are designed to introspect a native exception object. Since JS errors arrive as a plain string + attributes map, the native bridge should instead build the span directly from those inputs. There are two viable options — they are not mutually exclusive with the underlying goal, just two different amounts of native change.

#### Option A — Add a dedicated non-wrapping error path (original plan)

Bypass the exception-oriented APIs entirely by adding a new code path purpose-built for string+attributes input.

**Android — `CustomTrackingHandler.kt`**

Replace the call to `CustomTracking.instance.trackException(JsReportedException(message), attrs)` with a direct span build that:
- Uses the `exception.type` attribute value (already in `attrs`) as the span name, falling back to the message
- Sets `component=error` and `error=true` manually (same as `trackException` does)
- Sets all caller-supplied attributes via `setAllAttributes(attrs)`
- Does **not** call `recordException()` — the JS stacktrace is already in `exception.stacktrace` inside `attrs`

This means adding a dedicated path in `CustomTrackingHandler.trackError()` rather than routing through `CustomTracking.trackException()`.

**iOS — `CustomTrackingHandler.swift`**

The current call path is `SplunkRum.shared.customTracking.trackError(message, attrs)` → `SplunkIssue(from: message)` → `exceptionType = "String"`.

Two sub-options:
1. Pass the `exception.type` value from `attrs` directly into a `SplunkIssue` initialiser that accepts an explicit `exceptionType` string, so it is not derived from the Swift type of the message.
2. If `SplunkIssue` doesn't support that, build the span at the `CustomTrackingInternal` level directly using `CustomTrackingData` with the pre-merged attributes, bypassing `SplunkIssue` entirely.

Either way, the `exception.type` attribute we pass from JS must be preserved as-is.

Requires native code changes on both platforms (new span-building logic, or a new `SplunkIssue` initializer).

#### Option B — Reuse the existing `customTrackEvent` bridge path instead

Both platforms already expose a second bridge method, `customTrackEvent`/`trackCustomEvent`, that was built for arbitrary named events and — critically — never wraps the input in an exception/issue object. It builds the span/log entry directly from the caller-supplied name and attributes map, so none of the throwable-derived overwrite problems apply.

**Android — no native change required.**

[`CustomTracking.trackCustomEvent(name, attributes)`](../../splunk-otel-android/integration/customtracking/src/main/java/com/splunk/rum/integration/customtracking/CustomTracking.kt) builds the span as:

```kotlin
tracer.spanBuilder(name)                                 // name = whatever we pass, e.g. exception.type value
    .setAttribute(COMPONENT_KEY, COMPONENT_CUSTOM_EVENT)  // set first
    .setAllAttributes(attributes)                         // set second — last write wins per key
    .createZeroLengthSpan()
```

No `recordException()`, no throwable, no re-derived `exception.type`/stacktrace. Because `setAllAttributes` is applied *after* the hardcoded `component` attribute, an attrs map that includes `"component": "error"` and `"error": "true"` overrides the default `custom-event` value — so the JS layer can fully control `component`, `exception.type`, and the span name (pass the JS error type/message as the `name` argument) with zero native changes. This is purely a JS-side routing change: call `customTrackEvent(exceptionTypeOrMessage, attrsWithComponentAndErrorOverrides)` instead of `customTrackError(message, attrs)`.

**iOS — small native change still required.**

[`CustomTracking+Tracking.swift`'s `track(_ event: SplunkTrackableEvent)`](../../splunk-otel-ios/SplunkCustomTracking/Sources/SplunkCustomTracking/CustomTracking+Tracking.swift) (the path behind `trackCustomEvent`) builds:

```swift
CustomTrackingData(name: event.eventName, component: "custom-event", attributes: event.toAttributesDictionary())
```

This avoids `SplunkIssue` entirely (fixing the `exceptionType = "String"` bug for free), but `component` is a **struct field** set directly by `track(event:)`, not read from the attributes dictionary — so it cannot be overridden from the attrs map the way Android's `setAllAttributes` allows. A minimal native change is still needed here: let `component` be passed in (or read from a reserved attribute key) instead of being hardcoded to `"custom-event"`, so the JS layer can still tag these spans `component=error`.

**Trade-off summary:**

| | Option A | Option B |
|---|---|---|
| Android native change | Required (new span-build path) | None |
| iOS native change | Required (`SplunkIssue` init or bypass) | Required, but smaller (parameterize `component`) |
| Reuses existing bridge method | No — new method | Yes — `customTrackEvent` |
| Risk | New code path to test on both platforms | Mostly JS-side; iOS change is narrowly scoped |

Option B is the lighter-weight path since it eliminates the Android-side native change completely and narrows the iOS change to a single hardcoded field, but it does mean JS error spans piggyback on an API originally designed for custom business events — worth flagging to the native SDK owners before committing to it as the long-term shape.

### Impact

Until this is fixed:
- The span name in the Errors tab shows `JsReportedException` (Android) or `error` (iOS) instead of the JS error class name
- `exception.type` shows `JsReportedException` (Android) or `String` (iOS) instead of e.g. `TypeError`
- `exception.stacktrace` on Android may be overwritten with an empty string depending on OTel SDK attribute merge order

All other attributes (`error.layer`, `error.type`, `error.is_fatal`, `error.capture`, `exception.escaped`, etc.) are unaffected — they are set via `setAllAttributes` and do not conflict with any native introspection.

---

## Draft: Automatic Source Map Upload and Build ID Tagging

> **Status: draft / exploratory only.** This section captures a proposed approach, not a committed plan. It has not been reviewed with the backend team and depends on an open question below that needs their confirmation before any implementation starts.

### Goal

Automatically upload JS source maps at build time, and tag every error/crash span with a build identifier so the backend can look up the matching source map and symbolicate `exception.stacktrace`.

### What already exists

**`@splunk/rum-cli`** (published npm package, referenced already in [`packages/core/README.md`](../packages/core/README.md) but not wired into any build step) has a working `sourcemaps upload` command:

- Computes a `sourceMapId` by SHA-256 hashing the `.map` file's contents and formatting the hash as a GUID.
- Uploads via `PUT https://api.<realm>.signalfx.com/v2/rum-mfm/source-maps/id/<sourceMapId>` with header `X-SF-Token` and optional `appName`/`appVersion` form fields.
- Also has a `sourcemaps inject` command that writes a `window.sourceMapIds[...] = '<id>'` snippet into the JS file — **this does not apply to RN**: it assumes a `window` global and a `http(s)://` URL in the stack trace, neither of which exist in RN/Hermes. It also runs on the pre-Hermes-compile JS text, which is discarded once `hermesc` compiles it to bytecode ([`BundleHermesCTask.kt:96-117`](../../splunk-otel-react-native/example/node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/src/main/kotlin/com/facebook/react/tasks/BundleHermesCTask.kt)), so the snippet would never reach the shipped bundle. Only `sourcemaps upload` is reusable for RN.

**Where the bundle + map already get produced, per platform:**
- Android: `BundleHermesCTask` writes the bundle to `jsBundleDir` and the final composed source map (packager map + Hermes compiler map, merged via RN's `compose-source-maps.js`) to `jsSourceMapsDir/<bundleAssetName>.map` — but only when `hermesFlags` includes `-output-source-map`, which is currently commented out/unused in the example app.
- iOS: the standard "Bundle React Native code and images" Xcode phase (`react-native-xcode.sh`) produces `main.jsbundle.map` next to the bundle, driven by the `SOURCEMAP_FILE` build setting.

Both are directly analogous to where native `mapping.txt` (Android ProGuard) and `.dSYM` (iOS) already get produced before their respective existing uploaders run.

### Open question that blocks design — which build-ID scheme does the backend expect?

Two incompatible precedents already exist in the Splunk mobile stack:

1. **Content-hash scheme** (what `rum-cli sourcemaps upload` already does today): the ID is a SHA-256 hash of the map file itself. No manifest injection, no native code, no explicit "build id" concept — the map's own hash *is* the id, looked up via `rum-mfm/source-maps/id/<hash>`.
2. **Random-UUID-in-manifest scheme** (what Android's existing ProGuard mapping-file plugin does): a `UUID.randomUUID()` is generated once per build, injected into `AndroidManifest.xml` as `splunk.build_id` meta-data, read at runtime, and attached to every error/crash/ANR span by `ErrorIdentifierAttributesSpanProcessor`. The mapping file is uploaded to `rum-mfm/proguard/<appId>/<versionCode>/<buildId>`, keyed by that UUID.

The symbolication design doc's proposed `splunk.build_id` tag implicitly assumes scheme 2. But the only source-map upload path that already exists and works today (`rum-cli`) uses scheme 1. These are two different backend endpoints with two different identity models, and it is not yet known which one `svc-symbolication` actually expects RN JS source maps to use. **This needs to be confirmed with the backend engineer before any implementation work starts** — it changes almost everything about the design below (steps 2–4 in particular).

### Proposed pipeline (assuming scheme 1 — content hash; needs backend confirmation)

1. **Build step** (a new Gradle task on Android, a new build-phase script on iOS) runs after the bundle + map are produced. It computes the `sourceMapId` the same way `rum-cli` does (hash the `.map` file → format as GUID), then either shells out to `splunk-rum sourcemaps upload` or re-implements the same PUT call directly.
2. That ID isn't known until after the JS bundle is built, so it can't be baked into the bundle itself (circular — the bundle's own hash can't be embedded in the thing being hashed). It needs a side channel to reach the running app:
   - Android: inject into `AndroidManifest.xml` meta-data, reusing/extending the existing `BuildIdInjector.kt` pattern from the ProGuard flow.
   - iOS: no existing equivalent — would need a new build-phase step writing the value into `Info.plist` or a generated Swift constant.
3. Expose the value to JS at runtime by extending the native constants returned from `install()`/`getState()` in [`NativeSplunkOtelReactNative.ts`](../packages/core/src/specs/NativeSplunkOtelReactNative.ts) with a `buildId` field.
4. Set it **once**, at `SplunkRum.install()`, via `globalAttributesSetString('splunk.build_id', buildId)` — so every span in the session carries it automatically, mirroring how Android's native build_id is attached session-wide via `ErrorIdentifierAttributesSpanProcessor` rather than per-error-call in `JsErrorHandler.ts`.

### Why this is still a draft

- The scheme-1-vs-scheme-2 question above is unresolved and would materially change steps 2–4 if scheme 2 turns out to be required.
- No iOS equivalent of `BuildIdInjector.kt` exists yet; this would be new native code either way.
- Whether `rum-cli` should be depended on directly (as a build-time devDependency) versus having its upload logic re-implemented in-repo hasn't been decided.
- None of this has been discussed with the backend or native SDK owners yet — treat everything above as a starting point for that conversation, not a spec.
