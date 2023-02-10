/*
Copyright 2023 Splunk Inc.

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
import type { Attributes } from '@opentelemetry/api';

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

export interface NativeSdKConfiguration {
  beaconEndpoint?: string;
  rumAccessToken?: string;
  isOtlp?: boolean;
  skipEncode?: boolean;
  skipAuth?: boolean;
  globalAttributes?: object;
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

export function setNativeSessionId(id: string): Promise<boolean> {
  return SplunkOtelReactNative.setSessionId(id);
}

export function setNativeGlobalAttributes(
  attributes: Attributes
): Promise<boolean> {
  // For some reason React Native mucks with the input argument, destroying the object values.
  // E.g. { 'os.name': 'iOS' } gets turned into { 'os.name': [Getter/Setter] }
  return SplunkOtelReactNative.setGlobalAttributes({ ...attributes });
}

export function testNativeCrash() {
  SplunkOtelReactNative.nativeCrash();
}
