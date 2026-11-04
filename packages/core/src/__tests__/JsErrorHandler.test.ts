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

import * as JsErrorHandler from '../instrumentation/JsErrorHandler';
import { SplunkRum } from '../api/SplunkRum';

const mockRecordReactNativeFatalCrashSync = jest.fn().mockReturnValue(true);

jest.mock('../sdk/SplunkNativeBridge', () => ({
  SplunkNativeBridge: {
    recordReactNativeFatalCrashSync: (...args: unknown[]) =>
      mockRecordReactNativeFatalCrashSync(...args),
  },
}));

const mockTrackError = jest.fn().mockResolvedValue(undefined);

jest.mock('../api/SplunkRum', () => ({
  SplunkRum: class MockSplunkRum {
    customTracking = {
      trackError: mockTrackError,
    };
  },
}));

const previousGlobalHandler = jest.fn();
let installedGlobalHandler:
  | ((error: unknown, isFatal?: boolean) => void)
  | null = null;

const mockSetGlobalHandler = jest.fn(
  (handler: (error: unknown, isFatal?: boolean) => void) => {
    installedGlobalHandler = handler;
  }
);

const mockGetGlobalHandler = jest.fn(() => previousGlobalHandler);

const mockRejectionEnable = jest.fn();
const mockRejectionDisable = jest.fn();

jest.mock('promise/setimmediate/rejection-tracking', () => ({
  enable: (...args: unknown[]) => mockRejectionEnable(...args),
  disable: (...args: unknown[]) => mockRejectionDisable(...args),
}));

jest.mock('react-native/Libraries/promiseRejectionTrackingOptions', () => ({
  __esModule: true,
  default: {
    onUnhandled: jest.fn(),
    onHandled: jest.fn(),
  },
}));

jest.mock('react-native/Libraries/vendor/core/ErrorUtils', () => ({
  __esModule: true,
  default: {
    get getGlobalHandler() {
      return mockGetGlobalHandler;
    },
    get setGlobalHandler() {
      return mockSetGlobalHandler;
    },
  },
}));

type GlobalWithDevFlag = typeof globalThis & { __DEV__?: boolean };
type GlobalWithHermes = typeof globalThis & {
  HermesInternal?: {
    hasPromise?: () => boolean;
    enablePromiseRejectionTracker?: jest.Mock;
  };
};

const mockHermesEnableTracker = jest.fn();

describe('JsErrorHandler', () => {
  const originalDevFlag = (globalThis as GlobalWithDevFlag).__DEV__;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    installedGlobalHandler = null;
    (globalThis as GlobalWithDevFlag).__DEV__ = originalDevFlag;
    // Default: simulate JSC (no HermesInternal) so existing tests are unaffected.
    delete (globalThis as GlobalWithHermes).HermesInternal;
    mockRecordReactNativeFatalCrashSync.mockReturnValue(true);
    JsErrorHandler.uninstall();
  });

  afterEach(() => {
    jest.useRealTimers();
    (globalThis as GlobalWithDevFlag).__DEV__ = originalDevFlag;
    delete (globalThis as GlobalWithHermes).HermesInternal;
    JsErrorHandler.uninstall();
  });

  it('does not install when enabled is false', () => {
    const rum = new SplunkRum();

    JsErrorHandler.install(rum, { enabled: false });

    expect(mockSetGlobalHandler).not.toHaveBeenCalled();
    expect(mockRejectionEnable).not.toHaveBeenCalled();
  });

  it('chains the global handler and reports errors in development', () => {
    (globalThis as GlobalWithDevFlag).__DEV__ = true;
    const rum = new SplunkRum();

    JsErrorHandler.install(rum);

    expect(mockSetGlobalHandler).toHaveBeenCalled();
    expect(installedGlobalHandler).not.toBeNull();

    const error = new Error('global failure');
    installedGlobalHandler?.(error, true);

    expect(mockTrackError).toHaveBeenCalledWith(error, {
      attributes: {
        'error.layer': 'javascript',
        'error.type': 'js_exception',
        'exception.type': 'Error',
        'error.capture': 'globalHandler',
        'error.is_fatal': true,
        'exception.escaped': true,
      },
      source: 'source',
      handled: false,
    });
    expect(previousGlobalHandler).toHaveBeenCalledWith(error, true);
  });

  it('records a production fatal synchronously exactly once, then chains the previous handler', () => {
    (globalThis as GlobalWithDevFlag).__DEV__ = false;

    const rum = new SplunkRum();
    JsErrorHandler.install(rum);

    const error = new TypeError('fatal sync');
    installedGlobalHandler?.(error, true);

    // Synchronous durable write happens-before chaining — no awaiting required.
    expect(mockRecordReactNativeFatalCrashSync).toHaveBeenCalledTimes(1);
    expect(mockRecordReactNativeFatalCrashSync).toHaveBeenCalledWith(
      'fatal sync',
      error.stack ?? null,
      expect.objectContaining({
        'error.layer': 'javascript',
        'error.type': 'js_exception',
        'exception.type': 'TypeError',
        'error.is_fatal': true,
      })
    );

    // Fatal errors never use the async custom error API.
    expect(mockTrackError).not.toHaveBeenCalled();

    // Exactly one chain to the previous (native) handler.
    expect(previousGlobalHandler).toHaveBeenCalledWith(error, true);
    expect(previousGlobalHandler).toHaveBeenCalledTimes(1);
  });

  it('reentrant fatal emits once but still chains the previous handler each time', () => {
    (globalThis as GlobalWithDevFlag).__DEV__ = false;

    // Chaining the previous handler synchronously re-enters our handler with a
    // second fatal (the double-emit scenario). The reentrancy guard must skip
    // the duplicate emit but never swallow the chain.
    let reentered = false;
    previousGlobalHandler.mockImplementation(() => {
      if (!reentered) {
        reentered = true;
        installedGlobalHandler?.(new Error('reentrant fatal'), true);
      }
    });

    const rum = new SplunkRum();
    JsErrorHandler.install(rum);

    installedGlobalHandler?.(new Error('first fatal'), true);

    // Emit to native exactly once despite the reentrant fatal.
    expect(mockRecordReactNativeFatalCrashSync).toHaveBeenCalledTimes(1);
    // But the previous handler is chained for both the first and the reentrant
    // fatal — one chain per invocation, nothing swallowed.
    expect(previousGlobalHandler).toHaveBeenCalledTimes(2);
  });

  it('does not call the fatal recorder for non-fatal release errors', () => {
    (globalThis as GlobalWithDevFlag).__DEV__ = false;

    const rum = new SplunkRum();
    JsErrorHandler.install(rum);

    installedGlobalHandler?.(new Error('soft failure'), false);

    expect(mockRecordReactNativeFatalCrashSync).not.toHaveBeenCalled();
  });

  it('chains non-fatal release errors without waiting for trackError', () => {
    (globalThis as GlobalWithDevFlag).__DEV__ = false;
    mockTrackError.mockImplementation(() => new Promise<void>(() => undefined));

    const rum = new SplunkRum();
    JsErrorHandler.install(rum);

    const error = new Error('soft failure');
    installedGlobalHandler?.(error, false);

    expect(mockTrackError).toHaveBeenCalled();
    expect(previousGlobalHandler).toHaveBeenCalledWith(error, false);
  });

  it('chains fatal development errors without waiting for trackError', () => {
    (globalThis as GlobalWithDevFlag).__DEV__ = true;
    mockTrackError.mockImplementation(() => new Promise<void>(() => undefined));

    const rum = new SplunkRum();
    JsErrorHandler.install(rum);

    const error = new Error('fatal dev failure');
    installedGlobalHandler?.(error, true);

    expect(mockTrackError).toHaveBeenCalled();
    expect(previousGlobalHandler).toHaveBeenCalledWith(error, true);
  });

  it('chains the previous handler when native fatal persistence fails', () => {
    (globalThis as GlobalWithDevFlag).__DEV__ = false;
    mockRecordReactNativeFatalCrashSync.mockReturnValue(false);

    const rum = new SplunkRum();
    JsErrorHandler.install(rum);

    const error = new Error('fatal persistence failure');
    installedGlobalHandler?.(error, true);

    expect(mockRecordReactNativeFatalCrashSync).toHaveBeenCalledTimes(1);
    expect(previousGlobalHandler).toHaveBeenCalledWith(error, true);
  });

  it('chains the previous handler when the native fatal recorder throws', () => {
    (globalThis as GlobalWithDevFlag).__DEV__ = false;
    mockRecordReactNativeFatalCrashSync.mockImplementationOnce(() => {
      throw new Error('native bridge unavailable');
    });

    const rum = new SplunkRum();
    JsErrorHandler.install(rum);

    const error = new Error('fatal bridge failure');
    expect(() => installedGlobalHandler?.(error, true)).not.toThrow();

    expect(previousGlobalHandler).toHaveBeenCalledWith(error, true);
  });

  it('reports unhandled promise rejections', () => {
    const rum = new SplunkRum();

    mockRejectionEnable.mockImplementation((options) => {
      options.onUnhandled(42, new Error('promise failure'));
    });

    JsErrorHandler.install(rum);

    expect(mockRejectionEnable).toHaveBeenCalled();
    expect(mockTrackError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'promise failure' }),
      {
        attributes: {
        'error.layer': 'javascript',
        'error.type': 'js_unhandled_promise_rejection',
        'error.capture': 'unhandledPromiseRejection',
        'error.is_fatal': false,
        'exception.escaped': true,
        },
        source: 'source',
        handled: false,
      }
    );
  });

  it('does not throw when trackError rejects', () => {
    mockTrackError.mockRejectedValueOnce(new Error('native unavailable'));
    const rum = new SplunkRum();

    JsErrorHandler.install(rum);

    expect(() => {
      installedGlobalHandler?.(new Error('boom'), false);
    }).not.toThrow();
  });

  it('updates rumRef on reinstall without re-hooking handlers', () => {
    const rum1 = new SplunkRum();
    const rum2 = new SplunkRum();

    JsErrorHandler.install(rum1);
    const firstSetHandlerCallCount = mockSetGlobalHandler.mock.calls.length;

    // Second install with updateRumRef should not re-register handlers
    JsErrorHandler.install(rum2, { updateRumRef: true });
    expect(mockSetGlobalHandler.mock.calls.length).toBe(
      firstSetHandlerCallCount
    );

    // But errors should now route to rum2's trackError
    const error = new Error('after reinstall');
    installedGlobalHandler?.(error, false);
    expect(rum2.customTracking.trackError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        attributes: expect.objectContaining({ 'error.layer': 'javascript' }),
      })
    );
  });

  it('uses HermesInternal.enablePromiseRejectionTracker on Hermes instead of rejection-tracking', () => {
    (globalThis as GlobalWithHermes).HermesInternal = {
      hasPromise: () => true,
      enablePromiseRejectionTracker: mockHermesEnableTracker,
    };

    const rum = new SplunkRum();
    JsErrorHandler.install(rum);

    expect(mockHermesEnableTracker).toHaveBeenCalled();
    expect(mockRejectionEnable).not.toHaveBeenCalled();
  });

  it('reports unhandled promise rejections via Hermes tracker', () => {
    (globalThis as GlobalWithHermes).HermesInternal = {
      hasPromise: () => true,
      enablePromiseRejectionTracker: mockHermesEnableTracker,
    };

    mockHermesEnableTracker.mockImplementation((options) => {
      options.onUnhandled(99, new Error('hermes promise failure'));
    });

    const rum = new SplunkRum();
    JsErrorHandler.install(rum);

    expect(mockTrackError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'hermes promise failure' }),
      {
        attributes: {
        'error.layer': 'javascript',
        'error.type': 'js_unhandled_promise_rejection',
        'error.capture': 'unhandledPromiseRejection',
        'error.is_fatal': false,
        'exception.escaped': true,
        },
        source: 'source',
        handled: false,
      }
    );
  });

  it('restores Hermes rejection tracker on uninstall', () => {
    (globalThis as GlobalWithHermes).HermesInternal = {
      hasPromise: () => true,
      enablePromiseRejectionTracker: mockHermesEnableTracker,
    };

    const rum = new SplunkRum();
    JsErrorHandler.install(rum);
    JsErrorHandler.uninstall();

    // Should have been called twice: once to install ours, once to restore RN's default
    expect(mockHermesEnableTracker).toHaveBeenCalledTimes(2);
  });
});
