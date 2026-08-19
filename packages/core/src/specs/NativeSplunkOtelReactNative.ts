/*
 * Copyright 2025 Splunk Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  TurboModuleRegistry,
  NativeModules,
  type TurboModule,
} from 'react-native';

export type AttributeScalar = string | number | boolean;
export type AttributeArray = Array<AttributeScalar>;
export type NativeAttributeValue = AttributeScalar | AttributeArray;
export type NativeAttributes = { [key: string]: NativeAttributeValue };

export type NativeEndpoint = {
  realm?: string;
  rumAccessToken?: string;
  trace?: string;
  sessionReplay?: string;
};

export type NativeUser = {
  trackingMode: 'NO_TRACKING' | 'ANONYMOUS_TRACKING' | null;
};

export type NativeSession = {
  samplingRate: number;
};

export type NativeAgentConfiguration = {
  endpoint: NativeEndpoint | null;
  appName: string;
  deploymentEnvironment: string;
  appVersion: string | null;
  enableDebugLogging: boolean;
  globalAttributes: NativeAttributes;
  user: NativeUser;
  session: NativeSession;
  instrumentedProcessName: string | null;
  deferredUntilForeground: boolean;
};

export type NativeModuleConfiguration = {
  name: string;
  attributes: { [key: string]: string };
};
export type NativeModuleConfigurations = Array<NativeModuleConfiguration>;

export type NativeStatus =
  | { type: 'Running' }
  | {
      type: 'NotRunning';
      reason:
        | 'NotInstalled'
        | 'Subprocess'
        | 'SampledOut'
        | 'UnsupportedOsVersion';
    };

export type NativeState = {
  appName: string;
  appVersion: string;
  deploymentEnvironment: string;
  status: NativeStatus;
  endpoint: NativeEndpoint | null;
  isDebugLoggingEnabled: boolean;
  instrumentedProcessName: string | null;
  deferredUntilForeground: boolean;
};

export type NativeSessionState = { id: string; samplingRate: number };
export type NativeUserState = {
  trackingMode: 'NO_TRACKING' | 'ANONYMOUS_TRACKING';
};

export interface Spec extends TurboModule {
  readonly getConstants: () => {};

  // Installation
  install(
    configuration: { [key: string]: unknown },
    modules: Array<{ [key: string]: unknown }>
  ): Promise<void>;

  // Preferences
  getEndpointConfiguration(): Promise<NativeEndpoint | null>;
  setEndpointConfiguration(
    endpoint: { [key: string]: unknown } | null
  ): Promise<void>;

  // State and user/session
  getState(): Promise<NativeState>;
  getSessionState(): Promise<NativeSessionState>;
  getUserState(): Promise<NativeUserState>;
  setUserTrackingMode(mode: string | null): Promise<void>;

  // Global attributes
  globalAttributesSetString(key: string, value: string | null): Promise<void>;
  globalAttributesSetBoolean(key: string, value: boolean | null): Promise<void>;
  globalAttributesSetNumber(key: string, value: number | null): Promise<void>;
  globalAttributesSetArray(
    key: string,
    value: AttributeArray | null
  ): Promise<void>;

  globalAttributesGetValue(key: string): Promise<NativeAttributeValue | null>;
  globalAttributesGetString(key: string): Promise<string | null>;
  globalAttributesGetBoolean(key: string): Promise<boolean | null>;
  globalAttributesGetNumber(key: string): Promise<number | null>;
  globalAttributesGetArray(key: string): Promise<AttributeArray | null>;

  globalAttributesSetAll(map: { [key: string]: unknown }): Promise<number>;
  globalAttributesSetAllInNameSpace(
    nameSpace: string,
    map: { [key: string]: unknown }
  ): Promise<number>;
  globalAttributesRemove(key: string): Promise<NativeAttributeValue | null>;
  globalAttributesRemoveAll(): Promise<void>;
  globalAttributesContains(key: string): Promise<boolean>;
  globalAttributesGetAll(): Promise<NativeAttributes>;
  globalAttributesKeys(): Promise<Array<string>>;
  globalAttributesValues(): Promise<Array<NativeAttributeValue>>;
  globalAttributesSize(): Promise<number>;

  // Custom tracking
  customTrackEvent(
    name: string,
    attributes: { [key: string]: unknown }
  ): Promise<void>;
  customStartWorkflow(name: string): Promise<number>;
  customEndWorkflow(handle: number): Promise<void>;

  // Error tracking
  // Limited to flat primitives + JSON strings for codegen compat.
  // `framesJson` / `sourceMapIdsJson` are reserved for later, full automatic-capture phases.
  reportError(
    type: string,
    message: string,
    stacktrace: string,
    attributes: { [key: string]: unknown },
    framesJson: string,
    source: string,
    handled: boolean,
    sourceMapIdsJson: string
  ): Promise<void>;

  // Navigation
  navigationTrack(
    screenName: string,
    attributes: { [key: string]: unknown }
  ): Promise<void>;

  // WebView integration
  integrateWebViewWithBrowserRum(viewTag: number): Promise<void>;
}

const Turbo = TurboModuleRegistry.get<Spec>('SplunkOtelReactNative');
const Legacy = (NativeModules as any).SplunkOtelReactNative as Spec | undefined;

if (!Turbo && !Legacy) {
  throw new Error('Native module SplunkOtelReactNative is not linked.');
}

export default (Turbo ?? Legacy)!;
