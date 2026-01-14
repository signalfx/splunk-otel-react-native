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

/**
 * **Android only.** OkHttp3 manual instrumentation configuration.
 *
 * For manually adding interceptors to OkHttp3 clients.
 * Use when automatic instrumentation conflicts with custom OkHttp setup.
 */
export class OkHttp3ManualModuleConfiguration extends ModuleConfiguration {
  /**
   * @param requestHeaders - Request header names to capture in spans.
   * @param responseHeaders - Response header names to capture in spans.
   */
  constructor(
    public requestHeaders: string[] = [],
    public responseHeaders: string[] = []
  ) {
    super();
  }

  readonly name = 'okHttp3-manual';

  toNative() {
    return {
      name: this.name,
      attributes: {
        requestHeaders: this.requestHeaders.join(', '),
        responseHeaders: this.responseHeaders.join(', '),
      },
    };
  }
}
