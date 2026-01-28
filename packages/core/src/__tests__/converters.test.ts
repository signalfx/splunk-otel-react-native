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

describe('bridge/converters', () => {
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
