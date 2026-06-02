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
import { sanitizeAndJoinHeaders } from './sanitizeHeaderNames';

/**
 * **Android only.** OkHttp3 automatic instrumentation configuration.
 *
 * Automatically instruments all OkHttp3 clients for network tracing.
 */
export class OkHttp3AutoModuleConfiguration extends ModuleConfiguration {
  /**
   * @param isEnabled - Whether instrumentation is enabled. Defaults to `true`.
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
    public isEnabled: boolean = true,
    public requestHeaders: string[] = [],
    public responseHeaders: string[] = [],
    private debugLogging: boolean = false
  ) {
    super();
  }

  readonly name = 'okHttp3-auto';

  toNative() {
    return {
      name: this.name,
      attributes: {
        enabled: String(this.isEnabled),
        requestHeaders: sanitizeAndJoinHeaders(
          this.requestHeaders,
          'OkHttp3AutoModuleConfiguration.requestHeaders',
          this.debugLogging
        ),
        responseHeaders: sanitizeAndJoinHeaders(
          this.responseHeaders,
          'OkHttp3AutoModuleConfiguration.responseHeaders',
          this.debugLogging
        ),
      },
    };
  }
}
