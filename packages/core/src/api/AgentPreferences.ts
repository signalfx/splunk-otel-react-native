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
import { SplunkNativeBridge as Native } from '../sdk/SplunkNativeBridge';
import { toNativeEndpoint } from '../bridge/converters';

/**
 * Agent preferences for runtime configuration.
 *
 * Use this to dynamically configure agent settings after initialization.
 * Accessible via `SplunkRum.instance.preferences`.
 *
 * @example Setting endpoint after install
 * ```typescript
 * await SplunkRum.install({
 *   appName: 'MyApp',
 *   deploymentEnvironment: 'production',
 * });
 *
 * // Later, configure the endpoint
 * await SplunkRum.instance.preferences.setEndpointConfiguration({
 *   realm: 'us0',
 *   rumAccessToken: 'YOUR_TOKEN',
 * });
 * ```
 *
 * @example Clearing the endpoint
 * ```typescript
 * await SplunkRum.instance.preferences.setEndpointConfiguration(null);
 * ```
 */
export class AgentPreferences {
  /**
   * Sets the endpoint configuration for the RUM agent.
   *
   * - Setting a non-null value configures the endpoint and starts sending buffered data.
   * - Setting `null` disables the endpoint.
   *
   * @param endpoint - Endpoint configuration, or `null`.
   */
  async setEndpointConfiguration(
    endpoint: EndpointConfiguration | null
  ): Promise<void> {
    const native = endpoint ? toNativeEndpoint(endpoint) : null;

    return Native.setEndpointConfiguration(native);
  }
}
