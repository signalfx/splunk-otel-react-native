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

jest.mock('./src/specs/NativeSplunkOtelReactNative', () => ({
  __esModule: true,
  default: {
    getConstants: () => ({}),
    install: jest.fn().mockResolvedValue(undefined),
    getState: jest.fn().mockResolvedValue({
      appName: 'test-app',
      appVersion: '1.0.0',
      deploymentEnvironment: 'test',
      status: { type: 'Running' },
      endpoint: { trace: 'https://test.example.com' },
      isDebugLoggingEnabled: false,
      instrumentedProcessName: null,
      deferredUntilForeground: false,
    }),
    getSessionState: jest.fn().mockResolvedValue({
      id: 'test-session-id',
      samplingRate: 1.0,
    }),
    getUserState: jest.fn().mockResolvedValue({
      trackingMode: 'ANONYMOUS_TRACKING',
    }),
    setUserTrackingMode: jest.fn().mockResolvedValue(undefined),
    globalAttributesSetString: jest.fn().mockResolvedValue(undefined),
    globalAttributesSetBoolean: jest.fn().mockResolvedValue(undefined),
    globalAttributesSetNumber: jest.fn().mockResolvedValue(undefined),
    globalAttributesSetArray: jest.fn().mockResolvedValue(undefined),
    globalAttributesGetValue: jest.fn().mockResolvedValue(null),
    globalAttributesGetString: jest.fn().mockResolvedValue(null),
    globalAttributesGetBoolean: jest.fn().mockResolvedValue(null),
    globalAttributesGetNumber: jest.fn().mockResolvedValue(null),
    globalAttributesGetArray: jest.fn().mockResolvedValue(null),
    globalAttributesSetAll: jest.fn().mockResolvedValue(0),
    globalAttributesSetAllInNameSpace: jest.fn().mockResolvedValue(0),
    globalAttributesRemove: jest.fn().mockResolvedValue(null),
    globalAttributesRemoveAll: jest.fn().mockResolvedValue(undefined),
    globalAttributesContains: jest.fn().mockResolvedValue(false),
    globalAttributesGetAll: jest.fn().mockResolvedValue({}),
    globalAttributesKeys: jest.fn().mockResolvedValue([]),
    globalAttributesValues: jest.fn().mockResolvedValue([]),
    globalAttributesSize: jest.fn().mockResolvedValue(0),
    customTrackEvent: jest.fn().mockResolvedValue(undefined),
    customStartWorkflow: jest.fn().mockResolvedValue(1),
    customEndWorkflow: jest.fn().mockResolvedValue(undefined),
    navigationTrack: jest.fn().mockResolvedValue(undefined),
    integrateWebViewWithBrowserRum: jest.fn().mockResolvedValue(undefined),
  },
}));
