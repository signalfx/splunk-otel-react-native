# Changelog

## Unreleased

### Added

* `SensitiveView` component, which masks everything rendered inside it in session replay recordings. Note that masking and un-masking are not symmetric: `sensitive={true}` covers the whole subtree, while `sensitive={false}` applies to that view alone — sensitivity is resolved per view and never consults an ancestor. To exempt an element from a class-level rule, use `setViewSensitivity` with that element's own ref; to carve a region out of a masked area, use an erasing recording mask.
* Per-view and per-class sensitivity on `SplunkSessionReplay.instance`: `setViewSensitivity`, `clearViewSensitivity`, `setClassSensitivity`, `clearClassSensitivity`, `getClassSensitivity`.
* `maskAllText`, `maskAllImages` and `maskWebViews` convenience helpers. Neither native SDK has a global masking switch, so these are built on the per-class API.
* `NativeViewClass` constants mapping React Native primitives onto the native view classes the SDK defaults key off, so class rules work on both platforms without hardcoding names.
* `Sensitivity` and `RenderingMode` enums.
* `setRenderingMode`, and `renderingMode` on the `getState` snapshot.

### Changed

* **Recording mask coordinates are now React Native layout units on both platforms.** Previously values were passed to the native SDKs unchanged, which meant a rect authored from `onLayout` or `measureInWindow` was correct on iOS (points) but roughly three times too small on Android (physical device pixels). If you were compensating for that on Android, remove the scaling.
* Web views remain unmasked by default, matching both Splunk native agents, which clear the underlying SDKs' default at install. Call `maskWebViews()` to restore masking.

## 1.2.0

* Version bump in sync with `@splunk/otel-react-native`.
* Upgraded the development baseline to React Native `0.86.2` and bumped the native Splunk Android session replay SDK to `2.3.2`.

## 1.1.0

* Version bump in sync with `@splunk/otel-react-native`.
* Bumped the native Splunk Android session replay SDK to `2.3.1`.

## 1.0.2

* Version bump in sync with `@splunk/otel-react-native`.

## 1.0.1

* Version bump in sync with `@splunk/otel-react-native`.

## 1.0.0

Initial release of `@splunk/otel-session-replay-react-native`.

### Added
* `SplunkSessionReplay` API: `start`, `stop`, `getState`, `getRecordingMask`, `setRecordingMask`.
* Android and iOS native session replay powered by Splunk native SDKs (2.2.2).
