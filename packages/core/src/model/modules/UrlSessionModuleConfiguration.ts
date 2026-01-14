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
 * **iOS only.** URLSession network instrumentation configuration.
 *
 * Instruments `URLSession` requests for distributed tracing.
 */
export class UrlSessionModuleConfiguration extends ModuleConfiguration {
  /**
   * @param isEnabled - Whether instrumentation is enabled. Defaults to `true`.
   * @param ignoreURLs - Regex pattern(s) for URLs to exclude from tracing.
   *   Can be a single regex string or array of patterns (joined with `|`).
   */
  constructor(
    public isEnabled: boolean = true,
    public ignoreURLs?: string | string[]
  ) {
    super();
  }

  readonly name = 'urlSession';

  toNative() {
    const attrs: Record<string, string> = { enabled: String(this.isEnabled) };
    if (this.ignoreURLs) {
      attrs.ignoreURLs = Array.isArray(this.ignoreURLs)
        ? this.ignoreURLs.join('|')
        : this.ignoreURLs;
    }
    return { name: this.name, attributes: attrs };
  }
}
