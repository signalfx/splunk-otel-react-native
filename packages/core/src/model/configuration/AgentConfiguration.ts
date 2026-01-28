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
import type { EndpointConfiguration } from './EndpointConfiguration';

/**
 * Configuration for the Splunk RUM Agent.
 *
 * Pass this to `SplunkRum.install()` or `SplunkRumProvider` to initialize the SDK.
 */
export interface AgentConfiguration {
  /**
   * Endpoint configuration defining URLs to the instrumentation collector.
   *
   * Use realm-based or custom URL configuration.
   */
  endpoint: EndpointConfiguration;

  /**
   * Application name displayed in the RUM dashboard.
   *
   * Sent as a resource attribute with all signals.
   */
  appName: string;

  /**
   * Deployment environment (e.g., `dev`, `staging`, `production`).
   *
   * Sent as a resource attribute with all signals.
   */
  deploymentEnvironment: string;

  /**
   * Application version.
   *
   * Defaults to platform's bundle version (iOS: `CFBundleShortVersionString`, Android: `versionName`).
   */
  appVersion?: string;

  /**
   * Enables debug logging to console.
   *
   * Primarily designed for development, prints span contents. Defaults to `false`.
   */
  enableDebugLogging?: boolean;

  /**
   * Initial global attributes sent with all signals.
   *
   * Can be modified at runtime via `SplunkRum.instance.globalAttributes`.
   */
  globalAttributes?: Attributes;

  /**
   * User tracking configuration.
   */
  user?: {
    /**
     * User tracking mode.
     *
     * - `NO_TRACKING`: No user identifier generated.
     * - `ANONYMOUS_TRACKING`: Generates anonymous user ID per session.
     */
    trackingMode?: 'NO_TRACKING' | 'ANONYMOUS_TRACKING';
  };

  /**
   * Session configuration.
   */
  session?: {
    /**
     * Sampling rate for sessions (0.0 to 1.0).
     *
     * Value of 1.0 captures all sessions. Defaults to `1.0`.
     */
    samplingRate?: number;
  };

  /**
   * Name of the instrumented process.
   *
   * **Android only.** Used for multi-process apps.
   */
  instrumentedProcessName?: string | null;

  /**
   * Defers agent initialization until app enters foreground.
   *
   * **Android only.** Useful for background-started apps.
   */
  deferredUntilForeground?: boolean;
}
