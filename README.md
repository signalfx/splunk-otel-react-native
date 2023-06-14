# Splunk Distribution of OpenTelemetry for React Native

> :construction: This project is currently **Experimental**. Do not use it in production environments.

## Overview

This library lets you autoinstrument React Native applications. Minimum supported React Native version is 0.67.
To instrument applications running on React Native versions lower than 0.67, see [Instrument lower versions](instrument-lower-versions).

## Get started

To instrument your React Native application, follow these steps.

1. Install the library using either npm or yarn:

```
# npm
npm install @splunk/otel-react-native

# yarn
yarn add @splunk/otel-react-native
```

2. Initialize the library as early in your app lifecycle as possible:

```js
import { SplunkRum } from '@splunk/otel-react-native';

const Rum = SplunkRum.init({
  realm: 'us0',
  applicationName: 'reactNativeTest',
  rumAccessToken: 'token',
});

```

3. Customize the initialization parameters to specify:

- `realm`: The Splunk Observability Cloud realm of your organization. For example, `us0`.
- `rumAccessToken`: Your Splunk RUM authentication token. You can find or generate the token [here](https://app.signalfx.com/o11y/#/organization/current?selectedKeyValue=sf_section:accesstokens). Notice that RUM and APM authentication tokens are different.
- `applicationName`: Name of your application. Set it to distinguish your app from others in Splunk Observability Cloud.

> If needed, you can set a different target URL by specifying a value for `beaconEndpoint`. Setting a different beacon URL overrides the `realm` setting.

### Instrument lower versions

To instrument applications running on React Native versions lower than 0.67, edit your `metro.config.js` file to force metro to use browser specific packages. For example:

```js
const defaultResolver = require('metro-resolver');

module.exports = {
  resolver: {
    resolveRequest: (context, realModuleName, platform, moduleName) => {
      const resolved = defaultResolver.resolve(
        {
          ...context,
          resolveRequest: null,
        },
        moduleName,
        platform,
      );

      if (
        resolved.type === 'sourceFile' &&
        resolved.filePath.includes('@opentelemetry')
      ) {
        resolved.filePath = resolved.filePath.replace(
          'platform\\node',
          'platform\\browser',
        );
        return resolved;
      }

      return resolved;
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
```

## View navigation

[react-navigation](https://github.com/react-navigation/react-navigation) version 5 and 6 are supported.

The following example shows how to instrument navigation:

```js
import { startNavigationTracking } from '@splunk/otel-react-native';

export default function App() {
  const navigationRef = useNavigationContainerRef();
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        startNavigationTracking(navigationRef);
      }}
    >
      <Stack.Navigator>
        ...
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## Data collection

The library exports data using the Zipkin exporter. Adding your own exporters and processors isn't supported yet.

Supported features:

- Autoinstrumented HTTP requests
- Autoinstrumented JS Error tracking
- Autoinstrumented navigation tracking for react-navigation
- Session tracking
- Custom instrumentation using Opentelemetry
- Capturing native crashes

For more information about how this library uses Opentelemetry and about future plans check [CONTRIBUTING.md](CONTRIBUTING.md#Opentelemetry).

## License

Copyright 2023 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.

>ℹ️&nbsp;&nbsp;SignalFx was acquired by Splunk in October 2019. See [Splunk SignalFx](https://www.splunk.com/en_us/investor-relations/acquisitions/signalfx.html) for more information.
