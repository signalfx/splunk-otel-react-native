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

import type { Attributes } from '@opentelemetry/api';
import type { SplunkRum } from '../api/SplunkRum';
import { ErrorSource } from '../api/CustomTracking';
import { SplunkNativeBridge as Native } from '../sdk/SplunkNativeBridge';
import { setJsErrorDiagnosticLogging } from './JsErrorDiagnosticLogger';
import { addJavaScriptArtifactContext } from './JavaScriptSourceMapRegistry';

type ErrorHandler = (error: unknown, isFatal?: boolean) => void;

type RejectionTrackingOptions = {
  allRejections?: boolean;
  onUnhandled?: (id: number, rejection?: unknown) => void;
  onHandled?: (id: number) => void;
};

type RejectionTrackingModule = {
  enable: (options: RejectionTrackingOptions) => void;
  disable: () => void;
};

type HermesInternalType = {
  hasPromise?: () => boolean;
  enablePromiseRejectionTracker?: (options: RejectionTrackingOptions) => void;
};

type ErrorUtilsGlobal = {
  getGlobalHandler: () => ErrorHandler;
  setGlobalHandler: (handler: ErrorHandler) => void;
};

/**
 * TODO(react-native-crash-reporting): Error-capture hardening backlog:
 * - optionally capture console.error while preserving the original console method
 *   and preventing recursion;
 * - preserve and chain the actual installed promise-rejection tracker, including
 *   other monitoring SDKs, rather than only React Native's default callbacks;
 * - support Error.cause, AggregateError, circular/non-Error rejection values, and
 *   useful serialization of arbitrary thrown objects;
 * - add beforeSend/redaction, sampling/rate limiting, and fingerprint-based storm
 *   protection before events cross the native bridge;
 * - test supported React Native versions, Hermes/JSC, and old/new architectures
 *   because several hooks used below are React Native internals.
 */

export type JsErrorHandlerInstallOptions = {
  enabled?: boolean;
  debugLogging?: boolean;
  /**
   * When true, updates the internal SplunkRum reference even if the handler
   * is already installed. Use when SplunkRum.install() is called a second time
   * (e.g. after a hot reload or SDK re-init) to avoid reporting to a stale instance.
   */
  updateRumRef?: boolean;
};

let installed = false;
let rumRef: SplunkRum | null = null;
let debugLogging = false;
let previousGlobalHandler: ErrorHandler | null = null;
let previousRejectionOptions: RejectionTrackingOptions | null = null;
let handlingFatal = false;
let hermesTrackerInstalled = false;

function isErrorUtils(value: unknown): value is ErrorUtilsGlobal {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as ErrorUtilsGlobal;
  return (
    typeof candidate.getGlobalHandler === 'function' &&
    typeof candidate.setGlobalHandler === 'function'
  );
}

/**
 * Resolves the same ErrorUtils instance React Native uses (see error-guard.js).
 */
function getErrorUtils(): ErrorUtilsGlobal | null {
  try {
    // TODO(react-native-crash-reporting): Avoid this private React Native import
    // when a stable/global API is available; keep a compatibility test matrix
    // while the fallback depends on RN's internal package layout.

    const fromModule =
      require('react-native/Libraries/vendor/core/ErrorUtils').default;
    if (isErrorUtils(fromModule)) {
      return fromModule;
    }
  } catch {
    // RN not available (e.g. some test environments).
  }

  const globalThisRef = globalThis as typeof globalThis & {
    ErrorUtils?: unknown;
  };
  if (isErrorUtils(globalThisRef.ErrorUtils)) {
    return globalThisRef.ErrorUtils;
  }

  return null;
}

function getRejectionTracking(): RejectionTrackingModule | null {
  try {
    return require('promise/setimmediate/rejection-tracking') as RejectionTrackingModule;
  } catch {
    return null;
  }
}

function getReactNativeRejectionDefaults():
  RejectionTrackingOptions | undefined {
  try {
    return require('react-native/Libraries/promiseRejectionTrackingOptions')
      .default as RejectionTrackingOptions;
  } catch {
    return undefined;
  }
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  try {
    return new Error(String(error));
  } catch {
    return new Error('Unknown error');
  }
}

function rejectionToError(rejection: unknown): Error {
  if (rejection instanceof Error) {
    return rejection;
  }

  if (typeof rejection === 'string') {
    return new Error(rejection);
  }

  const err = new Error(formatRejectionMessage(rejection));
  if (
    rejection !== null &&
    typeof rejection === 'object' &&
    'stack' in rejection &&
    typeof (rejection as { stack?: unknown }).stack === 'string'
  ) {
    err.stack = (rejection as { stack: string }).stack;
  }

  return err;
}

function isDevEnvironment(): boolean {
  const devFlag = (globalThis as { __DEV__?: boolean }).__DEV__;
  return devFlag === true;
}

function shouldDeferFatalHandler(isFatal?: boolean): boolean {
  return Boolean(isFatal) && !isDevEnvironment();
}

function logFatalTimeline(
  phase: string,
  details?: Record<string, unknown>
): void {
  if (!debugLogging) {
    return;
  }

  console.log(`[SplunkRum][FatalErrorTimeline] ${phase}`, {
    t: Date.now(),
    ...details,
  });
}

function formatRejectionMessage(rejection: unknown): string {
  if (rejection instanceof Error) {
    return rejection.message || 'Unhandled promise rejection';
  }

  if (typeof rejection === 'string') {
    return rejection;
  }

  try {
    return JSON.stringify(rejection);
  } catch {
    return 'Unhandled promise rejection';
  }
}

async function reportErrorAsync(
  error: Error,
  attributes: Attributes
): Promise<void> {
  if (!rumRef) {
    if (debugLogging) {
      console.warn(
        '[SplunkRum] JsErrorHandler: skipped reporting (SDK not installed)'
      );
    }
    return;
  }

  const message = error.message?.trim();
  if (!message) {
    error.message = 'Unknown JavaScript error';
  }

  if (debugLogging) {
    console.log('[SplunkRum] Reporting JavaScript error', {
      message: error.message,
      attributes,
    });
  }

  try {
    await rumRef.customTracking.trackError(error, {
      attributes,
      source: ErrorSource.Source,
      handled: attributes['exception.escaped'] !== true,
    });
  } catch (failure) {
    console.warn('[SplunkRum] Failed to report JavaScript error', failure);
  }
}

function reportError(error: Error, attributes: Attributes): void {
  void reportErrorAsync(error, attributes);
}

/**
 * Records a production fatal through the native agent's bounded synchronous API.
 *
 * Both the old bridge and TurboModules expose this method as blocking. A true
 * result means the exact crash span is durable and the native duplicate marker
 * is armed before React Native's previous handler triggers the native crash.
 * Any native failure is fail-open: the previous handler still runs.
 */
function recordFatalSync(error: Error, attributes: Attributes): boolean {
  try {
    return Native.recordReactNativeFatalCrashSync(
      error.message,
      error.stack ?? null,
      addJavaScriptArtifactContext(attributes)
    );
  } catch (failure) {
    if (debugLogging) {
      console.warn(
        '[SplunkRum] recordReactNativeFatalCrashSync threw',
        failure
      );
    }
    return false;
  }
}

function invokePreviousGlobalHandler(error: unknown, isFatal?: boolean): void {
  try {
    previousGlobalHandler?.(error, isFatal);
  } catch (handlerError) {
    if (debugLogging) {
      console.warn(
        '[SplunkRum] Previous global error handler threw',
        handlerError
      );
    }
  }
}

function installGlobalHandler(): boolean {
  const errorUtils = getErrorUtils();
  if (!errorUtils) {
    if (debugLogging) {
      console.warn(
        '[SplunkRum] JsErrorHandler: ErrorUtils not available; global JS errors will not be auto-reported'
      );
    }
    return false;
  }

  previousGlobalHandler = errorUtils.getGlobalHandler();

  errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    const deferFatal = shouldDeferFatalHandler(isFatal);
    const normalized = normalizeError(error);
    const attributes: Attributes = {
      'error.layer': 'javascript',
      'error.type': 'js_exception',
      'exception.type': normalized.name || 'Error',
      'error.capture': 'globalHandler',
      'error.is_fatal': Boolean(isFatal),
      'exception.escaped': true,
    };

    // Non-fatal (or dev): report async and chain immediately. No dedup or
    // durable-write ordering needed — the process keeps running.
    if (!deferFatal) {
      reportError(normalized, attributes);
      invokePreviousGlobalHandler(error, isFatal);
      return;
    }

    // Reentrancy guard (bug #3 — double-emit). Chaining the previous handler can
    // synchronously re-enter this handler with the same (or a derived) fatal.
    // Emit to Splunk exactly once, but ALWAYS chain exactly once per invocation
    // so RN's native crash path is never blocked or duplicated.
    if (handlingFatal) {
      if (debugLogging) {
        console.warn(
          '[SplunkRum] JsErrorHandler: reentrant fatal; skipping duplicate emit, chaining previous handler'
        );
      }
      invokePreviousGlobalHandler(error, isFatal);
      return;
    }
    handlingFatal = true;

    const startedAt = Date.now();
    logFatalTimeline('fatal_handler_entered', {
      message: normalized.message,
      hasStack: Boolean(normalized.stack),
      stackLength: normalized.stack?.length ?? 0,
      __DEV__: (globalThis as { __DEV__?: boolean }).__DEV__,
    });

    // Chains the previous handler exactly once, then clears the guard. The guard
    // stays set THROUGH the chain so a synchronous reentrant fatal dedupes
    // instead of re-recording.
    const finish = (): void => {
      logFatalTimeline('chaining_previous_handler', {
        elapsedMs: Date.now() - startedAt,
      });
      try {
        invokePreviousGlobalHandler(error, isFatal);
      } finally {
        handlingFatal = false;
      }
    };

    try {
      logFatalTimeline('sync_record_start', {
        elapsedMs: Date.now() - startedAt,
      });
      const recorded = recordFatalSync(normalized, attributes);
      logFatalTimeline('sync_record_finished', {
        elapsedMs: Date.now() - startedAt,
        recorded,
      });
    } finally {
      finish();
    }
  });

  return true;
}

function getHermesInternal(): HermesInternalType | undefined {
  return (globalThis as { HermesInternal?: HermesInternalType }).HermesInternal;
}

function isHermes(): boolean {
  return Boolean(getHermesInternal()?.hasPromise?.());
}

function installPromiseRejectionHandler(): boolean {
  const priorOptions = getReactNativeRejectionDefaults();
  previousRejectionOptions = priorOptions ?? null;

  const priorOnUnhandled = priorOptions?.onUnhandled;
  const priorOnHandled = priorOptions?.onHandled;

  const ourOptions: RejectionTrackingOptions = {
    allRejections: true,
    onUnhandled: (id: number, rejection: unknown = {}) => {
      const error = rejectionToError(rejection);
      reportError(error, {
        'error.layer': 'javascript',
        'error.type': 'js_unhandled_promise_rejection',
        'error.capture': 'unhandledPromiseRejection',
        'error.is_fatal': false,
        'exception.escaped': true,
      });

      try {
        priorOnUnhandled?.(id, rejection);
      } catch (handlerError) {
        if (debugLogging) {
          console.warn(
            '[SplunkRum] Previous promise rejection handler threw',
            handlerError
          );
        }
      }
    },
    onHandled: (id: number) => {
      try {
        priorOnHandled?.(id);
      } catch (handlerError) {
        if (debugLogging) {
          console.warn(
            '[SplunkRum] Previous promise handled callback threw',
            handlerError
          );
        }
      }
    },
  };

  // On Hermes (default engine since RN 0.70), the JS Promise implementation is
  // native and rejection-tracking has no effect. Hermes exposes its own API for
  // registering a rejection tracker — the same one RN calls in polyfillPromise.js.
  // Calling it again replaces the previous registration (RN's default handler).
  if (isHermes()) {
    // TODO(react-native-crash-reporting): This API has no getter, so installing
    // here may replace another SDK's tracker. Adopt a supported get/set tracker
    // abstraction (or otherwise preserve the actual active tracker) and add
    // coexistence tests.
    const hermesInternal = getHermesInternal();
    if (!hermesInternal?.enablePromiseRejectionTracker) {
      if (debugLogging) {
        console.warn(
          '[SplunkRum] JsErrorHandler: Hermes detected but enablePromiseRejectionTracker unavailable'
        );
      }
      return false;
    }
    hermesInternal.enablePromiseRejectionTracker(ourOptions);
    hermesTrackerInstalled = true;
    return true;
  }

  // JSC / custom Promise polyfill path.
  const rejectionTracking = getRejectionTracking();
  if (!rejectionTracking) {
    if (debugLogging) {
      console.warn(
        '[SplunkRum] JsErrorHandler: promise rejection tracking unavailable'
      );
    }
    return false;
  }

  rejectionTracking.enable(ourOptions);
  return true;
}

/**
 * Installs automatic JavaScript error reporters (global handler and unhandled promises).
 */
export function install(
  rum: SplunkRum,
  options?: JsErrorHandlerInstallOptions
): void {
  setJsErrorDiagnosticLogging(Boolean(options?.debugLogging));

  if (options?.enabled === false) {
    // TODO(react-native-crash-reporting): If handlers are already installed,
    // disabling during SplunkRum reconfiguration must restore/uninstall them.
    // This early return currently leaves automatic reporting enabled.
    return;
  }

  if (installed) {
    if (options?.updateRumRef) {
      rumRef = rum;
      debugLogging = Boolean(options?.debugLogging);
    }
    return;
  }

  rumRef = rum;
  debugLogging = Boolean(options?.debugLogging);

  const globalHandlerInstalled = installGlobalHandler();
  const promiseHandlerInstalled = installPromiseRejectionHandler();

  if (!globalHandlerInstalled && !promiseHandlerInstalled) {
    rumRef = null;
    if (debugLogging) {
      console.warn(
        '[SplunkRum] JsErrorHandler: no reporters installed (check React Native environment)'
      );
    }
    return;
  }

  installed = true;

  if (debugLogging) {
    console.log('[SplunkRum] JsErrorHandler installed', {
      handlerVersion: 'durable-native-fatal-v1',
      globalHandler: globalHandlerInstalled,
      promiseRejections: promiseHandlerInstalled,
      deferFatalInRelease: !isDevEnvironment(),
      syncFatalRecording: true,
      __DEV__: (globalThis as { __DEV__?: boolean }).__DEV__,
    });
  }
}

/**
 * Removes automatic reporters. Intended for unit tests only.
 */
export function uninstall(): void {
  setJsErrorDiagnosticLogging(false);

  if (!installed) {
    return;
  }

  const errorUtils = getErrorUtils();
  if (errorUtils && previousGlobalHandler) {
    errorUtils.setGlobalHandler(previousGlobalHandler);
  }

  if (hermesTrackerInstalled) {
    // Restore RN's default Hermes rejection tracker if we have its options,
    // otherwise disable by registering a no-op (Hermes has no explicit disable).
    const hermesInternal = getHermesInternal();
    if (hermesInternal?.enablePromiseRejectionTracker) {
      if (previousRejectionOptions) {
        hermesInternal.enablePromiseRejectionTracker(previousRejectionOptions);
      } else {
        hermesInternal.enablePromiseRejectionTracker({});
      }
    }
  } else {
    const rejectionTracking = getRejectionTracking();
    if (rejectionTracking) {
      rejectionTracking.disable();
      if (previousRejectionOptions) {
        rejectionTracking.enable(previousRejectionOptions);
      }
    }
  }

  installed = false;
  rumRef = null;
  debugLogging = false;
  previousGlobalHandler = null;
  previousRejectionOptions = null;
  handlingFatal = false;
  hermesTrackerInstalled = false;
}
