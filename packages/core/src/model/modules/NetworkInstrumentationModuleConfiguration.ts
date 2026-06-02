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
  ModuleConfiguration,
  type ToNativeOptions,
} from './ModuleConfiguration';
import { sanitizeAndJoinHeaders } from './headers/sanitizeHeaderNames';

/**
 * **iOS only.** Network instrumentation configuration.
 *
 * Instruments `URLSession` requests for distributed tracing.
 */
export class NetworkInstrumentationModuleConfiguration extends ModuleConfiguration {
  /**
   * @param isEnabled - Whether instrumentation is enabled. Defaults to `true`.
   * @param ignoreURLs - Regex pattern(s) for URLs to exclude from tracing.
   *   Can be a single regex string or array of patterns (joined with `|`).
   * @param capturedRequestHeaders - HTTP request header names to capture as span attributes.
   *   Matching headers from outgoing requests are added to the HTTP span as
   *   `http.request.header.<lowercased-name>`. Header matching is case-insensitive.
   *   Names are trimmed; empty entries, entries that are not valid RFC 7230 header
   *   tokens, and case-insensitive duplicates are discarded.
   *
   *   **Security:** do not capture headers that carry credentials or session
   *   material (for example `Authorization`, `Proxy-Authorization`, `Cookie`).
   *   Their values would be persisted verbatim in telemetry.
   * @param capturedResponseHeaders - HTTP response header names to capture as span attributes.
   *   Matching headers from incoming responses are added to the HTTP span as
   *   `http.response.header.<lowercased-name>`. Header matching is case-insensitive.
   *   Names are trimmed; empty entries, entries that are not valid RFC 7230 header
   *   tokens, and case-insensitive duplicates are discarded.
   *
   *   **Security:** avoid capturing headers that carry session material such
   *   as `Set-Cookie` or `Set-Cookie2` to prevent leaking session identifiers
   *   into telemetry.
   *
   *   Note: multi-value headers are comma-joined by the native agent. Avoid
   *   capturing headers whose values may contain commas (for example, `Set-Cookie`)
   *   because their original structure cannot be reliably reconstructed.
   */
  constructor(
    public isEnabled: boolean = true,
    public ignoreURLs?: string | string[],
    public capturedRequestHeaders: string[] = [],
    public capturedResponseHeaders: string[] = []
  ) {
    super();
  }

  readonly name = 'networkInstrumentation';

  toNative(options?: ToNativeOptions) {
    const debug = options?.debugLogging ?? false;
    const attrs: Record<string, string> = { enabled: String(this.isEnabled) };
    if (this.ignoreURLs) {
      attrs.ignoreURLs = Array.isArray(this.ignoreURLs)
        ? this.ignoreURLs.join('|')
        : this.ignoreURLs;
    }

    const req = sanitizeAndJoinHeaders(
      this.capturedRequestHeaders,
      'NetworkInstrumentationModuleConfiguration.capturedRequestHeaders',
      debug
    );
    if (req) attrs.requestHeaders = req;

    const res = sanitizeAndJoinHeaders(
      this.capturedResponseHeaders,
      'NetworkInstrumentationModuleConfiguration.capturedResponseHeaders',
      debug
    );
    if (res) attrs.responseHeaders = res;

    return { name: this.name, attributes: attrs };
  }
}
