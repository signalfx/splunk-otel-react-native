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
  toNativeEndpoint,
  toNativeAgentConfiguration,
  fromNativeState,
} from '../bridge/converters';
import type { NativeState } from '../specs/NativeSplunkOtelReactNative';
import {
  ATTR_RN_FRAMEWORK_VERSION,
  ATTR_RN_SDK_VERSION,
  SDK_VERSION,
} from '../version';

let mockConstants: any = {
  reactNativeVersion: { major: 0, minor: 81, patch: 1 },
};

jest.mock('react-native', () => ({
  Platform: {
    get constants() {
      return mockConstants;
    },
  },
}));

describe('bridge/converters', () => {
  beforeEach(() => {
    mockConstants = {
      reactNativeVersion: { major: 0, minor: 81, patch: 1 },
    };
  });

  it('toNativeEndpoint maps realm endpoints', () => {
    const native = toNativeEndpoint({ realm: 'prod', rumAccessToken: 'token' });

    expect(native).toEqual({ realm: 'prod', rumAccessToken: 'token' });
  });

  it('toNativeEndpoint maps ingestion endpoints', () => {
    const native = toNativeEndpoint({ trace: 't', sessionReplay: 'l' });

    expect(native).toEqual({ trace: 't', sessionReplay: 'l' });
  });

  it('toNativeAgentConfiguration maps booleans and optionals', () => {
    const cfg = toNativeAgentConfiguration({
      endpoint: { trace: 't' },
      appName: 'app',
      deploymentEnvironment: 'prod',
      enableDebugLogging: true,
    });

    expect(cfg.appName).toBe('app');
    expect(cfg.deploymentEnvironment).toBe('prod');
    expect(cfg.appVersion).toBeNull();
    expect(cfg.enableDebugLogging).toBe(true);
    expect(cfg.session.samplingRate).toBe(1);
  });

  describe('toNativeAgentConfiguration version attributes', () => {
    it('injects version attributes when no globalAttributes provided', () => {
      const cfg = toNativeAgentConfiguration({
        endpoint: { trace: 't' },
        appName: 'app',
        deploymentEnvironment: 'prod',
      });

      expect(cfg.globalAttributes).toEqual({
        [ATTR_RN_FRAMEWORK_VERSION]: '0.81.1',
        [ATTR_RN_SDK_VERSION]: SDK_VERSION,
      });
    });

    it('preserves user globalAttributes alongside version attributes', () => {
      const cfg = toNativeAgentConfiguration({
        endpoint: { trace: 't' },
        appName: 'app',
        deploymentEnvironment: 'prod',
        globalAttributes: {
          'app.type': 'test',
          'custom.key': 42,
        },
      });

      expect(cfg.globalAttributes).toEqual({
        'app.type': 'test',
        'custom.key': 42,
        [ATTR_RN_FRAMEWORK_VERSION]: '0.81.1',
        [ATTR_RN_SDK_VERSION]: SDK_VERSION,
      });
    });

    it('version attributes override user-provided values with same keys', () => {
      const cfg = toNativeAgentConfiguration({
        endpoint: { trace: 't' },
        appName: 'app',
        deploymentEnvironment: 'prod',
        globalAttributes: {
          [ATTR_RN_FRAMEWORK_VERSION]: 'user-override-attempt',
          [ATTR_RN_SDK_VERSION]: 'user-override-attempt',
          'app.type': 'test',
        },
      });

      expect(cfg.globalAttributes[ATTR_RN_FRAMEWORK_VERSION]).toBe('0.81.1');
      expect(cfg.globalAttributes[ATTR_RN_SDK_VERSION]).toBe(SDK_VERSION);
      expect(cfg.globalAttributes['app.type']).toBe('test');
    });

    it('reflects the current RN version from Platform.constants', () => {
      mockConstants = {
        reactNativeVersion: { major: 0, minor: 79, patch: 2 },
      };

      const cfg = toNativeAgentConfiguration({
        endpoint: { trace: 't' },
        appName: 'app',
        deploymentEnvironment: 'prod',
      });

      expect(cfg.globalAttributes[ATTR_RN_FRAMEWORK_VERSION]).toBe('0.79.2');
    });

    it('uses "unknown" when Platform.constants is unavailable', () => {
      mockConstants = undefined;

      const cfg = toNativeAgentConfiguration({
        endpoint: { trace: 't' },
        appName: 'app',
        deploymentEnvironment: 'prod',
      });

      expect(cfg.globalAttributes[ATTR_RN_FRAMEWORK_VERSION]).toBe('unknown');
      expect(cfg.globalAttributes[ATTR_RN_SDK_VERSION]).toBe(SDK_VERSION);
    });
  });

  it('fromNativeState maps status and endpoint', () => {
    const native: NativeState = {
      appName: 'a',
      appVersion: '1.0',
      deploymentEnvironment: 'prod',
      status: { type: 'NotRunning', reason: 'NotInstalled' },
      endpoint: { trace: 't' },
      isDebugLoggingEnabled: false,
      instrumentedProcessName: null,
      deferredUntilForeground: false,
    };

    const state = fromNativeState(native);

    expect(state.status.type).toBe('NotRunning');
    expect(state.endpoint).toEqual({ trace: 't' });
  });
});
