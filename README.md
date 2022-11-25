# splunk-otel-react-native

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
