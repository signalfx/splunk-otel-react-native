# Splunk Distribution of OpenTelemetry for React Native

[![npm version](https://badge.fury.io/js/@splunk%2Fotel-react-native.svg)](https://badge.fury.io/js/@splunk%2Fotel-react-native)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Documentation

- [Install the Splunk RUM React Native Agent](https://help.splunk.com/en/splunk-observability-cloud/manage-data/available-data-sources/supported-integrations-in-splunk-observability-cloud/rum-instrumentation/instrument-mobile-and-web-applications-for-splunk-real-user-monitoring-rum/instrument-react-native-agent-applications-for-splunk-rum/install-the-splunk-rum-react-native-agent)
- [Troubleshoot React Native Instrumentation](https://help.splunk.com/en/splunk-observability-cloud/manage-data/available-data-sources/supported-integrations-in-splunk-observability-cloud/rum-instrumentation/instrument-mobile-and-web-applications-for-splunk-real-user-monitoring-rum/instrument-react-native-agent-applications-for-splunk-rum/troubleshoot-react-native-instrumentation)

## Overview

The Splunk Distribution of OpenTelemetry for React Native provides automatic instrumentation for React Native applications running on Android and iOS devices. This library captures telemetry data including:

- Application lifecycle events
- Network requests (fetch, XMLHttpRequest)
- User interactions
- App startup and performance metrics
- Crash reporting
- Manual error/exception reporting
- Slow rendering detection
- Navigation tracking

> [!IMPORTANT]
> This library instruments React Native applications for Android and iOS devices. For React web instrumentation, see the [splunk-otel-js-web](https://github.com/signalfx/splunk-otel-js-web) project.

## Requirements

- React Native >= 0.75.0
- React >= 18.2.0
- iOS >= 15.0
- Android minSdkVersion >= 24

## Installation

### For Expo Projects (with Development Builds)

This SDK supports Expo projects that use development builds (custom native code). It includes an Expo Config Plugin that automatically configures the native projects.

> **Note:** This SDK does not work with Expo Go since it requires custom native code. You must use a development build.

1. Install the SDK:

```bash
npx expo install @splunk/otel-react-native
```

2. Add the plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": ["@splunk/otel-react-native"]
  }
}
```

3. Run prebuild and build your development client:

```bash
npx expo prebuild
npx expo run:ios  # or npx expo run:android
```

### For Bare React Native Projects

1. Install the SDK:

```bash
npm install @splunk/otel-react-native
# or
yarn add @splunk/otel-react-native
```

2. **iOS Setup:**

```bash
cd ios && pod install && cd ..
```

3. **Android Setup:**

Enable core library desugaring in your android/app/build.gradle:

```groovy
android {
  compileOptions {
    // Flag to enable support for the new language APIs
    // For AGP 4.1+
    isCoreLibraryDesugaringEnabled = true
    // For AGP 4.0
    // coreLibraryDesugaringEnabled = true
    sourceCompatibility JavaVersion.VERSION_1_8
    targetCompatibility JavaVersion.VERSION_1_8
  }
  kotlinOptions {
    // If this setting is present, jvmTarget must be "1.8"
    jvmTarget = "1.8"
  }
}
dependencies {
  // For AGP 8+
  coreLibraryDesugaring "com.android.tools:desugar_jdk_libs:2.1.5"
  // For AGP 7.4+
  // coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.3")
  // For AGP 7.3
  // coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:1.2.3")
  // For AGP 4.0 to 7.2
  // coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:1.1.9")
}
```

Ensure minSdkVersion is 24 or higher.

The Maven repository is automatically configured. No additional setup required.

## Quick Start

### 1. Wrap Your App with `SplunkRumProvider`

```tsx
import { SplunkRumProvider } from '@splunk/otel-react-native';

export default function App() {
  return (
    <SplunkRumProvider
      agentConfiguration={{
        appName: 'MyApp',
        deploymentEnvironment: 'production',
        endpoint: {
          rumAccessToken: 'YOUR_RUM_TOKEN',
          realm: 'us0',
        },
      }}
    >
      <YourAppContent />
    </SplunkRumProvider>
  );
}
```

### 2. (Optional) Use the Imperative API

You can also initialize the SDK imperatively:

```tsx
import { SplunkRum } from '@splunk/otel-react-native';

await SplunkRum.install({
  appName: 'MyApp',
  deploymentEnvironment: 'production',
  endpoint: {
    rumAccessToken: 'YOUR_RUM_TOKEN',
    realm: 'us0',
  },
});
```

## Configuration

### Module Configuration

Control which features are enabled by passing module configurations:

```tsx
import {
  CrashReportsModuleConfiguration,
  NetworkMonitorModuleConfiguration,
  InteractionsModuleConfiguration,
  SlowRenderingModuleConfiguration,
} from '@splunk/otel-react-native';

<SplunkRumProvider
  agentConfiguration={{
    appName: 'MyApp',
    deploymentEnvironment: 'production',
    endpoint: {
      rumAccessToken: 'YOUR_RUM_TOKEN',
      realm: 'us0',
    },
  }}
  modules={[
    new CrashReportsModuleConfiguration(true),  // Enable crash reporting
    new NetworkMonitorModuleConfiguration(false),  // Disable network monitoring
    new InteractionsModuleConfiguration(true),  // Enable user interactions
    new SlowRenderingModuleConfiguration(true, 1000),  // Enabled, check every 1s (Android)
  ]}
>
  <YourAppContent />
</SplunkRumProvider>;
```

### Network Header Capture

Capture specific HTTP request and response headers as span attributes. Captured headers appear as `http.request.header.<name>` and `http.response.header.<name>` on network spans.

```tsx
import {
  NetworkInstrumentationModuleConfiguration,
  HttpURLModuleConfiguration,
  OkHttp3AutoModuleConfiguration,
} from '@splunk/otel-react-native';

const modules = [
  // iOS — URLSession instrumentation
  new NetworkInstrumentationModuleConfiguration(
    true,       // enabled
    undefined,  // ignoreURLs
    ['Content-Type', 'Accept'],                   // capturedRequestHeaders
    ['Content-Type', 'Content-Encoding', 'Server'] // capturedResponseHeaders
  ),
  // Android — HttpURLConnection instrumentation
  new HttpURLModuleConfiguration(
    true,
    ['Content-Type', 'Accept'],
    ['Content-Type', 'Content-Encoding', 'Server']
  ),
  // Android — OkHttp3 instrumentation
  new OkHttp3AutoModuleConfiguration(
    true,
    ['Content-Type', 'Accept'],
    ['Content-Type', 'Content-Encoding', 'Server']
  ),
];
```

Header names are validated against RFC 7230 before being forwarded to the native agent. Invalid, empty, and duplicate entries are silently dropped (or logged via `console.warn` when `enableDebugLogging` is set in the agent configuration).

> **Security:** Do not capture headers that carry credentials or session material (for example `Authorization`, `Cookie`, `Set-Cookie`).

### Global Attributes

Add custom attributes to all telemetry:

```tsx
import { SplunkRum } from '@splunk/otel-react-native';

// Set a single attribute
await SplunkRum.instance.globalAttributes.set('user.id', '12345');

// Set multiple attributes
await SplunkRum.instance.globalAttributes.set({
  'app.version': '1.2.3',
  'user.tier': 'premium',
});
```

### User Tracking

Control user session tracking:

```tsx
import { SplunkRum } from '@splunk/otel-react-native';

// Set tracking mode
await SplunkRum.instance.user.setTrackingMode('ANONYMOUS_TRACKING');
```

### Custom Events

Track custom events:

```tsx
import { SplunkRum } from '@splunk/otel-react-native';

// Track a simple event
await SplunkRum.instance.customTracking.trackCustomEvent('purchase_completed', {
  'product.id': 'abc123',
  'product.price': 99.99,
});

// Track a workflow with duration
const workflow = await SplunkRum.instance.customTracking.startWorkflow('checkout');
// ... perform checkout steps ...
await workflow.end();
```

### Error Tracking

Report a **caught** JS error or exception (from a `try/catch`, an error boundary, or a handled promise rejection) as a first-class RUM error. Each report is emitted as a `component=error` span carrying the OpenTelemetry `exception.*` semantics (`exception.type`, `exception.message`, `exception.stacktrace`) alongside the current `screen.name`, `session.id`, and your custom attributes.

```tsx
import { SplunkRum } from '@splunk/otel-react-native';

// Report a caught error (the common case)
try {
  cart.checkout();
} catch (e) {
  SplunkRum.instance.customTracking.trackError(e as Error);
}

// Report from a message string
await SplunkRum.instance.customTracking.trackError('Checkout failed');

// Report with attributes and options
await SplunkRum.instance.customTracking.trackError(error, {
  attributes: { 'screen.name': 'Cart', 'cart.item.count': 3 },
  handled: true, // non-fatal (default). false sets exception.escaped=true
});
```

`trackError` accepts either an `Error` object or a message `string`, plus optional `ReportErrorOptions`:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `attributes` | `Attributes` | `{}` | Custom attributes attached to the error span. |
| `source` | `ErrorSource` | `ErrorSource.Custom` | Origin of the error. Only `Custom` is active today; the other values are reserved for automatic capture. |
| `handled` | `boolean` | `true` | Whether the error was handled (non-fatal). Emitted as `exception.escaped = !handled`. |
| `timestampMs` | `number` | `Date.now()` | Capture time in epoch milliseconds. |

Key behaviors:

- **Side-effect only / never throws.** `trackError` never consumes or alters the caught error and never throws back into your `catch`. The returned `Promise` always resolves (it does not reject), so it stays `await`-safe and never produces an unhandled rejection. Reporting failures are surfaced only as a `console.warn`. You keep full control to log, show UI, retry, or re-throw.
- **No-op before install.** Before `install()` completes, `trackError` resolves silently.
- **Raw stacktrace is always sent.** The engine's `error.stack` is transported verbatim as `exception.stacktrace`. In debug / non-minified bundles this is human-readable as-is. In release builds the JS is minified and compiled to Hermes bytecode, so frames look like `index.bundle:1:<byteOffset>` and are not yet symbolicated — this is a valid, complete span; readable symbolication is planned for a future release. String-only reports carry no stacktrace.

> **Security:** `exception.message` and any attributes you pass may contain user data. Avoid reporting values that carry credentials, tokens, or other sensitive material.

### Navigation Tracking

Screen navigation is emitted as `app.ui.navigation` telemetry by the native agents, which also adds the current `screen.name` onto all other telemetry (errors, crashes, network spans, session replay).

In a React Native app, native automatic detection only sees the host `Activity` / view controller (and `react-native-screens` containers), not the app's JS routes. Keep native automatic tracking **off** and let the JS layer report real screen names:

```tsx
new NavigationModuleConfiguration(true, false); // enabled, native auto-tracking off
```

#### Automatic tracking with `react-navigation`

The agent ships a `react-navigation` integration behind a dedicated subpath. It observes the `NavigationContainer` ref and reports focused-route changes; it never imports `@react-navigation/native` (declared only as an optional peer), so apps that don't use it pull nothing.

```tsx
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { reactNavigationIntegration } from '@splunk/otel-react-native/react-navigation';

const splunkNavigation = reactNavigationIntegration();

export default function App() {
  const navigationRef = useNavigationContainerRef();

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => splunkNavigation.registerNavigationContainer(navigationRef)}
    >
      {/* ... */}
    </NavigationContainer>
  );
}
```

Registration can happen at any time — if the container is not ready yet, the initial screen is captured from its `ready` event. Call `splunkNavigation.unregisterNavigationContainer()` to stop tracking. Expo Router works unchanged (pass its `useNavigationContainerRef()` result).

Options let you rename, filter, and enrich tracked views:

```tsx
reactNavigationIntegration({
  // Rename a view, or return null/'' to skip tracking it.
  viewNamePredicate: (route, defaultName) =>
    route.name === 'Secret' ? null : defaultName,
  // Decide whether a route is tracked at all.
  shouldTrackView: (route) => route.name !== 'Debug',
  // Attach attributes (e.g. selected route params). Off by default.
  attributesFromRoute: (route) => ({ 'route.key': route.key ?? route.name }),
  // Track the first screen on register. Defaults to true.
  trackInitialRoute: true,
});
```

The route change pipeline is as follows: dedup by route key -> `viewNamePredicate` -> `shouldTrackView` -> `attributesFromRoute` -> emit. Consecutive updates to the same focused route (e.g. param-only changes) are suppressed.

#### Manual tracking

For custom navigation systems, track screens directly:

```tsx
import { SplunkRum } from '@splunk/otel-react-native';

await SplunkRum.instance.navigation.track('Checkout', { 'order.id': 'abc123' });
```

### WebView Integration

Instrument WebViews to capture web-based telemetry:

```tsx
import { SplunkWebView } from '@splunk/otel-react-native';

<SplunkWebView
  source={{ uri: 'https://example.com' }}
  style={{ flex: 1 }}
/>;
```

## Testing

For unit tests, use the provided Jest mock:

```js
// jest.config.js
module.exports = {
  moduleNameMapper: {
    '@splunk/otel-react-native':
      '<rootDir>/node_modules/@splunk/otel-react-native/jest/mock.js',
  },
};
```

Or import it directly:

```js
jest.mock('@splunk/otel-react-native', () =>
  require('@splunk/otel-react-native/jest')
);
```

The same mock also provides `reactNavigationIntegration` (a no-op detector). If you import the navigation integration from its subpath, map it to the mock too:

```js
// jest.config.js
moduleNameMapper: {
  '@splunk/otel-react-native/react-navigation':
    '<rootDir>/node_modules/@splunk/otel-react-native/jest/mock.js',
  '@splunk/otel-react-native':
    '<rootDir>/node_modules/@splunk/otel-react-native/jest/mock.js',
},
```

## Troubleshooting

### Common Issues

1. **"Native module SplunkOtelReactNative is not linked"**
   - Make sure you've run `pod install` (iOS) or rebuilt the app (Android)
   - For Expo, ensure you've run `expo prebuild`

2. **iOS build errors: "Module 'SplunkOtel' not found"**
   - Run: `cd ios && rm -rf build Pods Podfile.lock && pod install && cd ..`
   - Ensure you're using iOS 15.0+ as minimum deployment target

3. **Expo Go not supported**
   - This SDK requires custom native code and doesn't work with Expo Go
   - Use a development build instead

4. **Build errors on iOS**
   - Ensure you're using iOS 15.0+ as minimum deployment target
   - Clean build folder: `cd ios && rm -rf build && cd ..`

## Contributing

Contributions are welcome! See the [Contributing Guide](https://github.com/signalfx/splunk-otel-react-native/blob/main/CONTRIBUTING.md).

## Support

- [GitHub Issues](https://github.com/signalfx/splunk-otel-react-native/issues)
- [Splunk Observability Documentation](https://help.splunk.com/en/splunk-observability-cloud/get-started)
- [Community Forums](https://community.splunk.com/)


## License

Copyright 2025 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.

>ℹ️&nbsp;&nbsp;SignalFx was acquired by Splunk in October 2019. See [Splunk SignalFx](https://www.splunk.com/en_us/investor-relations/acquisitions/signalfx.html) for more information.
