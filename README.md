# Splunk distribution of OpenTelemetry for React Native

> :construction: This project status is currently **Experimental**. Using it in production is not advised.

## Getting Started

Installing with npm:
```
npm install @splunk/otel-react-native
```
Installing with yarn
```
yarn add @splunk/otel-react-native
```

Setup
1. Initialize the library as early in your App lifecycle as possible by calling:

```js
import { SplunkRum } from '@splunk/otel-react-native';

const Rum = SplunkRum.init({
  realm: 'us0'.
  applicationName: 'reactNativeTest',
  rumAccessToken: 'token',
});

```

2. Modify the initialization parameters to specify:

- `realm` - If sending data to Splunk ingest use realm you are using (i.e. us0, us1)
  - `beaconUrl` - It is possible to send data to arbitary url by specifing this parameter. Setting this will override realm.
- `rumAuth` - token authorizing the Agent to send the telemetry to the backend. You can find (or generate) the token [here](https://app.signalfx.com/o11y/#/organization/current?selectedKeyValue=sf_section:accesstokens). Notice that RUM and APM auth tokens are different.
- `app` - naming the application that will be monitored so it can be distinguished from other applications.

## View navigation
[react-navigation](https://github.com/react-navigation/react-navigation) v6 and v5 are currently supported.

### Usage
```
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

## Gathered Data

Currently only Zipkin exporter is used for sending data. Adding your own exporters/processors is not yet supported. 

Supported features
- Autoinstrumented HTTP requests
- Autoinstrumented JS Error tracking
- Custom instrumentation via opentelemetry

For more information about how this library uses opentelemetry and about future plans check [here](CONTRIBUTING.md#Opentelemetry).

## License
Copyright 2022 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.

>ℹ️&nbsp;&nbsp;SignalFx was acquired by Splunk in October 2019. See [Splunk SignalFx](https://www.splunk.com/en_us/investor-relations/acquisitions/signalfx.html) for more information.
