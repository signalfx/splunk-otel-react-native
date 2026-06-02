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
 * Base class for module configurations.
 *
 * Modules configure optional SDK features like network monitoring,
 * crash reporting, slow rendering detection, etc.
 *
 * Pass module configurations to `SplunkRum.install()` or `SplunkRumProvider`.
 *
 * @example
 * ```typescript
 * await SplunkRum.install(config, [
 *   new CrashReportsModuleConfiguration(true),
 *   new SlowRenderingModuleConfiguration(true, 1000),
 *   new NetworkMonitorModuleConfiguration(false),
 * ]);
 * ```
 */
export interface ToNativeOptions {
  debugLogging?: boolean;
}

export abstract class ModuleConfiguration {
  /** Module identifier used internally. */
  abstract readonly name: string;

  /** Converts configuration to native format. */
  abstract toNative(options?: ToNativeOptions): {
    name: string;
    attributes: Record<string, string>;
  };
}
