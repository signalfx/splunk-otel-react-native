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
 * Slow/frozen frame detection configuration.
 *
 * Detects UI frames that take too long to render, indicating performance issues.
 */
export class SlowRenderingModuleConfiguration extends ModuleConfiguration {
  /**
   * @param isEnabled - Whether slow rendering detection is enabled. Defaults to `true`.
   * @param intervalMilliseconds - Polling interval in milliseconds. **Android only.** Defaults to `1000`.
   */
  constructor(
    public isEnabled: boolean = true,
    public intervalMilliseconds: number = 1000
  ) {
    super();
  }

  readonly name = 'slowrendering';

  toNative() {
    return {
      name: this.name,
      attributes: {
        enabled: String(this.isEnabled),
        interval: `PT${this.intervalMilliseconds / 1000}S`,
      },
    };
  }
}
