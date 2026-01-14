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
 * Crash reporting configuration.
 *
 * Captures unhandled exceptions and crashes.
 */
export class CrashModuleConfiguration extends ModuleConfiguration {
  /**
   * @param isEnabled - Whether crash reporting is enabled. Defaults to `true`.
   */
  constructor(public isEnabled: boolean = true) {
    super();
  }

  readonly name = 'crash';

  toNative() {
    return { name: this.name, attributes: { enabled: String(this.isEnabled) } };
  }
}
