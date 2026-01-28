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

/**
 * Endpoint configuration for the Splunk RUM collector.
 *
 * @example Realm-based configuration
 * ```typescript
 * const endpoint = { realm: 'us0', rumAccessToken: 'YOUR_TOKEN' };
 * ```
 *
 * @example Custom URL configuration
 * ```typescript
 * const endpoint = {
 *   trace: 'https://custom-collector.example.com/v1/traces',
 *   sessionReplay: 'https://custom-collector.example.com/v1/logs'
 * };
 * ```
 */
export type EndpointConfiguration =
  /**
   * Realm-based endpoint configuration.
   *
   * Automatically constructs Splunk Cloud URLs from realm.
   */
  | {
      /** Splunk realm (e.g., `us0`, `us1`, `eu0`). */
      realm: string;
      /** RUM access token for authentication. */
      rumAccessToken: string;
    }
  /**
   * Custom URL endpoint configuration.
   *
   * Use for self-hosted collectors or custom routing.
   */
  | {
      /** Traces endpoint URL (required). */
      trace: string;
      /** Session replay endpoint URL (optional). */
      sessionReplay?: string;
    };
