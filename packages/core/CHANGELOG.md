# Changelog

## Unreleased

* TBD

## 1.0.3

### Added
* **Automatic navigation tracking for `react-navigation`.** New `reactNavigationIntegration()` (imported from the `@splunk/otel-react-native/react-navigation` subpath) observes the `NavigationContainer` ref and reports JS screen changes as `app.ui.navigation` telemetry via the native navigation module, which also propagates `screen.name` to all other telemetry. Supports `viewNamePredicate`, `shouldTrackView`, `attributesFromRoute`, and `trackInitialRoute` options; captures the initial screen from the container's `ready` event, and declares `@react-navigation/native` only as an optional peer dependency (no runtime import). Works with Expo Router.
* **Navigation attributes.** `SplunkRum.instance.navigation.track(screenName, attributes?)` now accepts optional attributes, forwarded to the native navigation module (reserved keys `component`, `navigation.name`, `screen.name`, `last.screen.name` are stripped).

### Changed
* Bumped the native Splunk Android RUM SDK to `2.3.2` and the native iOS RUM SDK to `2.3.1`.

## 1.0.2

### Added
* **HTTP header capture for Network instrumentation.** `NetworkInstrumentationModuleConfiguration`, `HttpURLModuleConfiguration` and `OkHttp3AutoModuleConfiguration` now accept `capturedRequestHeaders` and `capturedResponseHeaders` to capture specific HTTP headers as span attributes (`http.request.header.<name>` / `http.response.header.<name>`). All the headers undergo RFC 7230 header name sanitization.

## 1.0.1

### Changed

* **iOS: Removed `USE_FRAMEWORKS=dynamic` requirement.** The native iOS SDK is now distributed as vendored xcframeworks instead of being resolved via SPM at `pod install` time. This means the SDK now works with any CocoaPods linkage mode, including `use_frameworks! :linkage => :static` (required by Firebase, Adobe AEP, and similar dependencies). No Podfile changes are needed to integrate the SDK.

* **iOS Bumped native iOS Splunk RUM SDK to 2.2.3**, which fixes an App Store validation failure (`Validation failed (409) CFBundleIdentifier Collision`) that prevented users from uploading their apps.

## 1.0.0

First stable release of `@splunk/otel-react-native`.

### Added
* `AgentPreferences` API for server-driven agent configuration.
* SDK and React Native framework version attributes (`rum.sdk.rn.version`, `splunk.app.framework.rn.version`) on all telemetry.
* `SessionReplayModuleConfiguration` for configuring Session Replay from the core package.
* Endpoint configuration is now optional.

### Changed
* Ingest URLs updated from `*.signalfx.com` to `*.observability.splunkcloud.com`.
* Native Splunk OTel SDKs updated to `2.2.2`.

### Fixed
* Global attributes not being applied correctly on Android.

## 1.0.0-alpha.1

* An alpha release of the new, next-generation Splunk OTel SDK

### Added
* Modular feature configuration via `ModuleConfiguration` classes (ANR, crash reports, network, navigation, startup, etc.).
* Declarative `SplunkRumProvider` + React context, and `SplunkWebView` integration.
* Expo config plugin for prebuild/autoconfiguration.
* Session, user, state, and custom tracking APIs plus `MutableAttributes`.
* TurboModule spec with New Architecture support, Kotlin & Swift native implementations.
* iOS SPM integration of `splunk-otel-ios` (requires dynamic frameworks linking of Pod dependencies).

### Changed
* Initialization now uses async `SplunkRum.install` with `AgentConfiguration`/`EndpointConfiguration`.
* Export/instrumentation moved to native SDKs - JS layer no longer manages OTel pipelines.
* Updated platform/tooling requirements and packaging.

### Deprecated
* Legacy wrapper/init helpers (e.g., `OtelWrapper`, `SplunkRum.init`) in favor of provider/install.
* Legacy navigation helper APIs superseded by module-based navigation configuration.

### Removed
* Legacy JS OpenTelemetry exporters/instrumentations (XHR/errors/Zipkin) in favor of native SDKs.
* Legacy config flags for buffering/insecure endpoints now handled by native defaults.

### Fixed
* Improved type safety, initialization ordering, and state API consistency.
* Improved overall stability by utilising native Splunk OTel SDKs.

## 1.0.0-dev.1

* Test release of the new, alpha version of the SDK

## 0.3.4

* Add Privacyinfo for iOS

## 0.3.3

* Fix session timeout causing a crash

## 0.3.2

* Upgrade OTEL components to 1.20
* Fix iOS number conversion

## 0.3.1

* Fix global attributes

## 0.3.0

* Add carrier info

## 0.2.0

* Add disk caching for java
