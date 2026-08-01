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

Report a **caught** JS error or exception as a first-class RUM error span (`component=error`) carrying the OpenTelemetry `exception.type` / `exception.message` / `exception.stacktrace` attributes. Accepts either an `Error` object or a message `string`, plus optional `ReportErrorOptions` (`attributes`, `source`, `handled`, `timestampMs`).

```tsx
import { SplunkRum } from '@splunk/otel-react-native';

try {
  cart.checkout();
} catch (e) {
  SplunkRum.instance.customTracking.trackError(e as Error);
}

// Message string, or with attributes/options
await SplunkRum.instance.customTracking.trackError('Checkout failed');
await SplunkRum.instance.customTracking.trackError(error, {
  attributes: { 'screen.name': 'Cart' },
  handled: true, // non-fatal (default); false sets exception.escaped=true
});
```

`trackError` is side-effect only: it never consumes the error and never throws back into your `catch` — the returned `Promise` always resolves. The raw JS stacktrace is sent verbatim as `exception.stacktrace`, while in release (minified/Hermes) builds it is unsymbolicated for now but still a valid, complete span. See the [package README](./packages/core/README.md#error-tracking) for the full option reference.

> **Security:** `exception.message` and any attributes you pass may contain user data! Avoid reporting values that contain credentials, tokens or other sensitive material.

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
