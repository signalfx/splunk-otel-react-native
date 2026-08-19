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

import type { EndpointConfiguration } from '../model/configuration/EndpointConfiguration';

/**
 * Agent runtime status.
 */
export type SplunkRumStatus =
  | { type: 'Running' }
  | {
      type: 'NotRunning';
      reason:
        /** Agent not installed via `SplunkRum.install()`. */
        | 'NotInstalled'
        /** Running in a subprocess (Android multi-process). */
        | 'Subprocess'
        /** Session was sampled out per `samplingRate`. */
        | 'SampledOut'
        /** Platform version not supported. */
        | 'UnsupportedOsVersion';
    };

/**
 * Agent runtime state.
 *
 * Reflects current configuration and status.
 */
export interface SplunkRumState {
  /** Configured application name. */
  appName: string;
  /** Configured application version. */
  appVersion: string;
  /** Configured deployment environment. */
  deploymentEnvironment: string;
  /** Current agent status. */
  status: SplunkRumStatus;
  /** Configured endpoint, or `undefined` when no endpoint has been set. */
  endpoint?: EndpointConfiguration;
  /** Whether debug logging is enabled. */
  isDebugLoggingEnabled: boolean;
  /** Instrumented process name. **Android only.** */
  instrumentedProcessName?: string | null;
  /** Whether initialization was deferred. **Android only.** */
  deferredUntilForeground: boolean;
}

/**
 * Current session state.
 */
export interface SessionState {
  /** Unique session identifier. */
  id: string;
  /** Session sampling rate (0.0 to 1.0). */
  samplingRate: number;
}

/**
 * User tracking mode.
 *
 * - `NO_TRACKING`: No user identifier generated.
 * - `ANONYMOUS_TRACKING`: Generates anonymous user ID per session.
 */
export type UserTrackingMode = 'NO_TRACKING' | 'ANONYMOUS_TRACKING';

/**
 * Current user state.
 */
export interface UserState {
  /** Active user tracking mode. */
  trackingMode: UserTrackingMode;
}
