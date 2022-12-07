# Splunk distribution of OpenTelemetry for React Native

> :construction: This project status is currently **Experimental**. Using it in production is not advised.

## Install dependencies

Calling
```sh
yarn
```
in parent folder should install everything. In iOS it sometimes doesn't.
It is not currently in npm.

To get npm package to install somewhere else:
```
yarn pack
```
Produces splunk-otel-react-native-v0.1.0.tgz which you can just
```
yarn add splunk-otel-react-native-v0.1.0.tgz
```
in some other project.
## Running

In example folder run:
```
npx react-native start
```
and in another terminal tab run:
```
npx react-native run-android
```
or
```
npx react-native run-ios
```

To run native RN project in IDE open example/android in android studio or example/ios/BasicRnModuleExample.xcworkspace in XCode
# Usage
Somwhere in your app call SplunkRum.init()

```js
import { SplunkRum } from 'splunk-otel-react-native';

export const Rum = SplunkRum.init({
  beaconEndpoint: 'https://rum-ingest.us0.signalfx.com/v1/rum',
  applicationName: 'reactNativeTest',
  rumAccessToken: 'token',
});

```

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
