/*
Copyright 2022 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'splunk-otel-react-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const SplunkOtelReactNative = NativeModules.SplunkOtelReactNative
  ? NativeModules.SplunkOtelReactNative
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export interface ReactNativeConfiguration {
  realm?: string;
  beaconEndpoint: string;
  rumAccessToken: string;
  applicationName: string;
  environment?: string;
  appStart?: boolean;
  debug?: boolean;
}

export interface NativeSdKConfiguration {
  beaconEndpoint?: string;
  rumAccessToken?: string;
}
//TODO should probably not export this
export function initializeNativeSdk(
  config: NativeSdKConfiguration
): Promise<number> {
  return SplunkOtelReactNative.initialize(config);
}

export function exportSpanToNative(span: object): Promise<null> {
  return SplunkOtelReactNative.export(span);
}

// TODO workaround for otel which uses timeOrigin
if (!global.performance.timeOrigin) {
  (global as any).performance.timeOrigin = Date.now() - performance.now();
}

export * from './splunkRum';
export * from './trackNavigation';
