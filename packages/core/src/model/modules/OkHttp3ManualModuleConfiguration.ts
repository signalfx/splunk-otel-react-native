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

import { ModuleConfiguration } from './ModuleConfiguration';
import { sanitizeAndJoinHeaders } from './headers/sanitizeHeaderNames';

/**
 * **Android only.** OkHttp3 manual instrumentation configuration.
 *
 * For manually adding interceptors to OkHttp3 clients.
 * Use when automatic instrumentation conflicts with custom OkHttp setup.
 */
export class OkHttp3ManualModuleConfiguration extends ModuleConfiguration {
  /**
   * @param requestHeaders - HTTP request header names to capture as span attributes.
   *   Matching headers are added as `http.request.header.<lowercased-name>`.
   *   Names are trimmed; empty, invalid (non-RFC 7230), and duplicate entries
   *   are discarded.
   *
   *   **Security:** do not capture headers that carry credentials or session
   *   material (for example `Authorization`, `Proxy-Authorization`, `Cookie`).
   * @param responseHeaders - HTTP response header names to capture as span attributes.
   *   Matching headers are added as `http.response.header.<lowercased-name>`.
   *   Names are trimmed; empty, invalid (non-RFC 7230), and duplicate entries
   *   are discarded.
   *
   *   **Security:** avoid capturing `Set-Cookie` or `Set-Cookie2`.
   * @param debugLogging - Pass `true` to log sanitization warnings. Defaults to `false`.
   */
  constructor(
    public requestHeaders: string[] = [],
    public responseHeaders: string[] = [],
    private debugLogging: boolean = false
  ) {
    super();
  }

  readonly name = 'okHttp3-manual';

  toNative() {
    return {
      name: this.name,
      attributes: {
        requestHeaders: sanitizeAndJoinHeaders(
          this.requestHeaders,
          'OkHttp3ManualModuleConfiguration.requestHeaders',
          this.debugLogging
        ),
        responseHeaders: sanitizeAndJoinHeaders(
          this.responseHeaders,
          'OkHttp3ManualModuleConfiguration.responseHeaders',
          this.debugLogging
        ),
      },
    };
  }
}
