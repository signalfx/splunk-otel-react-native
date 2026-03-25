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

const globalAttributesMock = {
  setValue: jest.fn().mockResolvedValue(undefined),
  setString: jest.fn().mockResolvedValue(undefined),
  setBoolean: jest.fn().mockResolvedValue(undefined),
  setNumber: jest.fn().mockResolvedValue(undefined),
  setArray: jest.fn().mockResolvedValue(undefined),
  getValue: jest.fn().mockResolvedValue(undefined),
  getString: jest.fn().mockResolvedValue(undefined),
  getBoolean: jest.fn().mockResolvedValue(undefined),
  getNumber: jest.fn().mockResolvedValue(undefined),
  getArray: jest.fn().mockResolvedValue(undefined),
  setAll: jest.fn().mockResolvedValue(0),
  setAllInNamespace: jest.fn().mockResolvedValue(0),
  remove: jest.fn().mockResolvedValue(undefined),
  removeAll: jest.fn().mockResolvedValue(undefined),
  contains: jest.fn().mockResolvedValue(false),
  getAll: jest.fn().mockResolvedValue({}),
  keys: jest.fn().mockResolvedValue([]),
  values: jest.fn().mockResolvedValue([]),
  size: jest.fn().mockResolvedValue(0),
  update: jest.fn().mockResolvedValue(undefined),
};

const sessionMock = {
  state: jest.fn().mockResolvedValue({
    id: 'test-session-id',
    samplingRate: 1.0,
  }),
};

const userPreferencesMock = {
  setTrackingMode: jest.fn().mockResolvedValue(undefined),
};

const userMock = {
  preferences: userPreferencesMock,
  state: jest.fn().mockResolvedValue({
    trackingMode: 'ANONYMOUS_TRACKING',
  }),
};

const customTrackingMock = {
  trackCustomEvent: jest.fn().mockResolvedValue(undefined),
  startWorkflow: jest
    .fn()
    .mockResolvedValue({ end: jest.fn().mockResolvedValue(undefined) }),
};

const navigationMock = {
  track: jest.fn().mockResolvedValue(undefined),
};

const agentPreferencesMock = {
  getEndpointConfiguration: jest.fn().mockResolvedValue(undefined),
  setEndpointConfiguration: jest.fn().mockResolvedValue(undefined),
};

const splunkRumInstanceMock = {
  preferences: agentPreferencesMock,
  globalAttributes: globalAttributesMock,
  session: sessionMock,
  user: userMock,
  customTracking: customTrackingMock,
  navigation: navigationMock,
  get state() {
    return Promise.resolve({
      appName: 'test-app',
      appVersion: '1.0.0',
      deploymentEnvironment: 'test',
      status: { type: 'Running' },
      endpoint: { trace: 'https://test.example.com' },
      isDebugLoggingEnabled: false,
      instrumentedProcessName: null,
      deferredUntilForeground: false,
    });
  },
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
  integrateWebViewWithBrowserRum: jest.fn().mockResolvedValue(undefined),
};

const SplunkRumMock = {
  install: jest.fn().mockResolvedValue(undefined),
  get instance() {
    return splunkRumInstanceMock;
  },
};

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

class MutableAttributesMock {
  constructor() {
    this._attributes = {};
  }

  async setValue(key, value) {
    if (value === null) {
      delete this._attributes[key];
    } else {
      this._attributes[key] = value;
    }
  }

  async setString(key, value) {
    return this.setValue(key, value);
  }

  async setBoolean(key, value) {
    return this.setValue(key, value);
  }

  async setNumber(key, value) {
    return this.setValue(key, value);
  }

  async setArray(key, value) {
    return this.setValue(key, value);
  }

  async getValue(key) {
    return this._attributes[key];
  }

  async getString(key) {
    return this._attributes[key];
  }

  async getBoolean(key) {
    return this._attributes[key];
  }

  async getNumber(key) {
    return this._attributes[key];
  }

  async getArray(key) {
    return this._attributes[key];
  }

  async setAll(attributes) {
    Object.assign(this._attributes, attributes);
    return Object.keys(attributes).length;
  }

  async setAllInNamespace(namespace, attributes) {
    const prefixed = {};

    for (const [key, value] of Object.entries(attributes)) {
      prefixed[`${namespace}.${key}`] = value;
    }

    Object.assign(this._attributes, prefixed);
    return Object.keys(attributes).length;
  }

  async remove(key) {
    const prev = this._attributes[key];
    delete this._attributes[key];
    return prev;
  }

  async removeAll() {
    this._attributes = {};
  }

  async contains(key) {
    return key in this._attributes;
  }

  async getAll() {
    return { ...this._attributes };
  }

  async keys() {
    return Object.keys(this._attributes);
  }

  async values() {
    return Object.values(this._attributes);
  }

  async size() {
    return Object.keys(this._attributes).length;
  }

  async update(mutator) {
    const current = await this.getAll();
    const updated = mutator(current);

    const currentKeys = Object.keys(current);
    const updatedKeys = new Set(Object.keys(updated));
    for (const key of currentKeys) {
      if (!updatedKeys.has(key)) {
        await this.remove(key);
      }
    }

    await this.setAll(updated);
  }
}

class AgentPreferencesMock {
  constructor() {
    this.getEndpointConfiguration = jest.fn().mockResolvedValue(undefined);
    this.setEndpointConfiguration = jest.fn().mockResolvedValue(undefined);
  }
}

module.exports = {
  SplunkRum: SplunkRumMock,
  SplunkRumProvider: SplunkRumProviderMock,
  SplunkWebView: SplunkWebViewMock,
  AgentPreferences: AgentPreferencesMock,
  ModuleConfiguration: ModuleConfigurationMock,
  AnrModuleConfiguration: createModuleConfigMock('anr'),
  ApplicationLifecycleModuleConfiguration: createModuleConfigMock(
    'applicationLifecycle'
  ),
  CrashReportsModuleConfiguration: createModuleConfigMock('crash'),
  HttpURLModuleConfiguration: createModuleConfigMock('httpUrl'),
  InteractionsModuleConfiguration: createModuleConfigMock('interactions'),
  NavigationModuleConfiguration: createModuleConfigMock('navigation'),
  NetworkMonitorModuleConfiguration: createModuleConfigMock('networkMonitor'),
  OkHttp3AutoModuleConfiguration: createModuleConfigMock('okHttp3Auto'),
  OkHttp3ManualModuleConfiguration: createModuleConfigMock('okHttp3Manual'),
  SlowRenderingModuleConfiguration: SlowRenderingModuleConfigurationMock,
  StartupModuleConfiguration: createModuleConfigMock('startup'),
  NetworkInstrumentationModuleConfiguration: createModuleConfigMock(
    'networkInstrumentation'
  ),
  MutableAttributes: MutableAttributesMock,
};
