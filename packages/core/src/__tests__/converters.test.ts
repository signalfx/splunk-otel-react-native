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
  fromNativeEndpoint,
} from '../bridge/converters';
import type { NativeState } from '../specs/NativeSplunkOtelReactNative';

describe('bridge/converters', () => {
  describe('toNativeEndpoint', () => {
    it('maps realm endpoints', () => {
      const native = toNativeEndpoint({
        realm: 'prod',
        rumAccessToken: 'token',
      });

      expect(native).toEqual({ realm: 'prod', rumAccessToken: 'token' });
    });

    it('maps ingestion endpoints', () => {
      const native = toNativeEndpoint({ trace: 't', sessionReplay: 'l' });

      expect(native).toEqual({ trace: 't', sessionReplay: 'l' });
    });
  });

  describe('toNativeAgentConfiguration', () => {
    it('maps booleans and optionals', () => {
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
      expect(cfg.endpoint).toEqual({ trace: 't' });
    });

    it('passes null endpoint when endpoint is omitted', () => {
      const cfg = toNativeAgentConfiguration({
        appName: 'app',
        deploymentEnvironment: 'prod',
      });

      expect(cfg.endpoint).toBeNull();
      expect(cfg.appName).toBe('app');
    });

    it('passes null endpoint when endpoint is undefined', () => {
      const cfg = toNativeAgentConfiguration({
        endpoint: undefined,
        appName: 'app',
        deploymentEnvironment: 'prod',
      });

      expect(cfg.endpoint).toBeNull();
    });

    it('maps realm endpoint when provided', () => {
      const cfg = toNativeAgentConfiguration({
        endpoint: { realm: 'us0', rumAccessToken: 'tok' },
        appName: 'app',
        deploymentEnvironment: 'prod',
      });

      expect(cfg.endpoint).toEqual({ realm: 'us0', rumAccessToken: 'tok' });
    });
  });

  describe('fromNativeEndpoint', () => {
    it('returns undefined for null', () => {
      expect(fromNativeEndpoint(null)).toBeUndefined();
    });

    it('returns undefined for undefined', () => {
      expect(fromNativeEndpoint(undefined)).toBeUndefined();
    });

    it('maps realm endpoint', () => {
      expect(
        fromNativeEndpoint({ realm: 'us0', rumAccessToken: 'tok' })
      ).toEqual({
        realm: 'us0',
        rumAccessToken: 'tok',
      });
    });

    it('maps trace endpoint', () => {
      expect(fromNativeEndpoint({ trace: 'https://t.example.com' })).toEqual({
        trace: 'https://t.example.com',
      });
    });

    it('maps trace endpoint with sessionReplay', () => {
      expect(
        fromNativeEndpoint({
          trace: 'https://t.example.com',
          sessionReplay: 'https://sr.example.com',
        })
      ).toEqual({
        trace: 'https://t.example.com',
        sessionReplay: 'https://sr.example.com',
      });
    });

    it('returns undefined for empty endpoint with no trace and no realm', () => {
      expect(fromNativeEndpoint({})).toBeUndefined();
    });
  });

  describe('fromNativeState', () => {
    it('maps status and endpoint', () => {
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

    it('maps null endpoint to undefined', () => {
      const native: NativeState = {
        appName: 'a',
        appVersion: '1.0',
        deploymentEnvironment: 'prod',
        status: { type: 'Running' },
        endpoint: null,
        isDebugLoggingEnabled: false,
        instrumentedProcessName: null,
        deferredUntilForeground: false,
      };

      const state = fromNativeState(native);

      expect(state.endpoint).toBeUndefined();
    });

    it('maps Running status', () => {
      const native: NativeState = {
        appName: 'myApp',
        appVersion: '2.0',
        deploymentEnvironment: 'staging',
        status: { type: 'Running' },
        endpoint: { realm: 'eu0', rumAccessToken: 'x' },
        isDebugLoggingEnabled: true,
        instrumentedProcessName: 'main',
        deferredUntilForeground: true,
      };

      const state = fromNativeState(native);

      expect(state.status).toEqual({ type: 'Running' });
      expect(state.appName).toBe('myApp');
      expect(state.appVersion).toBe('2.0');
      expect(state.deploymentEnvironment).toBe('staging');
      expect(state.isDebugLoggingEnabled).toBe(true);
      expect(state.instrumentedProcessName).toBe('main');
      expect(state.deferredUntilForeground).toBe(true);
      expect(state.endpoint).toEqual({
        realm: 'eu0',
        rumAccessToken: 'x',
      });
    });
  });
});
