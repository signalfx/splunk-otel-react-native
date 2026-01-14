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

/* eslint-disable no-undef */
/* prettier-ignore */
const React = require('react');

/**
 * Jest mock for @splunk/otel-react-native
 *
 * Usage in your test setup:
 *   jest.mock('@splunk/otel-react-native', () => require('@splunk/otel-react-native/jest'));
 *
 * Or in jest.config.js:
 *   moduleNameMapper: {
 *     '@splunk/otel-react-native': '<rootDir>/node_modules/@splunk/otel-react-native/jest/mock.js'
 *   }
 */

const SplunkRumProviderMock = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};

const SplunkWebViewMock = () => {
  return null;
};

// Mock SplunkRum API
const SplunkRumMock = {
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
  session: {
    getState: jest.fn().mockResolvedValue({
      id: 'test-session-id',
      samplingRate: 1.0,
    }),
  },
  user: {
    getState: jest.fn().mockResolvedValue({
      trackingMode: 'ANONYMOUS_TRACKING',
    }),
    setTrackingMode: jest.fn().mockResolvedValue(undefined),
  },
  globalAttributes: {
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    remove: jest.fn().mockResolvedValue(null),
    removeAll: jest.fn().mockResolvedValue(undefined),
    contains: jest.fn().mockResolvedValue(false),
    getAll: jest.fn().mockResolvedValue({}),
    keys: jest.fn().mockResolvedValue([]),
    values: jest.fn().mockResolvedValue([]),
    size: jest.fn().mockResolvedValue(0),
  },
  customTracking: {
    trackEvent: jest.fn().mockResolvedValue(undefined),
    startWorkflow: jest
      .fn()
      .mockResolvedValue({ end: jest.fn().mockResolvedValue(undefined) }),
  },
};

// Mock module configuration classes
class ModuleConfigurationMock {
  constructor(name, isEnabled = true) {
    this.name = name;
    this.isEnabled = isEnabled;
  }
  toNative() {
    return { name: this.name, attributes: { enabled: String(this.isEnabled) } };
  }
}

const createModuleConfigMock = (name) => {
  return class extends ModuleConfigurationMock {
    constructor(isEnabled = true) {
      super(name, isEnabled);
    }
  };
};

// Special case for SlowRenderingModuleConfiguration with extra parameter
class SlowRenderingModuleConfigurationMock extends ModuleConfigurationMock {
  constructor(isEnabled = true, intervalMilliseconds = 1000) {
    super('slowRendering', isEnabled);
    this.intervalMilliseconds = intervalMilliseconds;
  }
  toNative() {
    return {
      name: this.name,
      attributes: {
        enabled: String(this.isEnabled),
        interval: `PT${this.intervalMilliseconds / 1000}S`,
      },
    };
  }
}

// Mock MutableAttributes
class MutableAttributesMock {
  constructor() {
    this._attributes = {};
  }
  set(key, value) {
    this._attributes[key] = value;
    return this;
  }
  remove(key) {
    delete this._attributes[key];
    return this;
  }
  toObject() {
    return { ...this._attributes };
  }
}

module.exports = {
  SplunkRum: SplunkRumMock,
  SplunkRumProvider: SplunkRumProviderMock,
  SplunkWebView: SplunkWebViewMock,
  ModuleConfiguration: ModuleConfigurationMock,
  AnrModuleConfiguration: createModuleConfigMock('anr'),
  ApplicationLifecycleModuleConfiguration: createModuleConfigMock(
    'applicationLifecycle'
  ),
  CrashModuleConfiguration: createModuleConfigMock('crash'),
  HttpURLModuleConfiguration: createModuleConfigMock('httpUrl'),
  InteractionsModuleConfiguration: createModuleConfigMock('interactions'),
  NavigationModuleConfiguration: createModuleConfigMock('navigation'),
  NetworkMonitorModuleConfiguration: createModuleConfigMock('networkMonitor'),
  OkHttp3AutoModuleConfiguration: createModuleConfigMock('okHttp3Auto'),
  OkHttp3ManualModuleConfiguration: createModuleConfigMock('okHttp3Manual'),
  SlowRenderingModuleConfiguration: SlowRenderingModuleConfigurationMock,
  StartupModuleConfiguration: createModuleConfigMock('startup'),
  UrlSessionModuleConfiguration: createModuleConfigMock('urlSession'),
  MutableAttributes: MutableAttributesMock,
};
