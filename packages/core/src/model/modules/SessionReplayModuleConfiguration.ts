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
 * Configuration for the Session Replay module.
 *
 * Enables screen recording for session replay in Splunk Observability Cloud.
 * Requires the `@splunk/otel-session-replay-react-native` package to be installed.
 *
 * @example
 * ```typescript
 * await SplunkRum.install(config, [
 *   new SessionReplayModuleConfiguration(true, 1.0),
 * ]);
 * ```
 */
export class SessionReplayModuleConfiguration extends ModuleConfiguration {
  readonly name = 'sessionReplay';

  /**
   * @param isEnabled - Whether session replay recording starts automatically after install.
   * @param samplingRate - Sampling rate between 0.0 and 1.0. Default is 0.2 (20%).
   */
  constructor(
    public readonly isEnabled: boolean = true,
    public readonly samplingRate: number = 0.2
  ) {
    super();
  }

  toNative(): { name: string; attributes: Record<string, string> } {
    const clampedRate = Math.min(1, Math.max(0, this.samplingRate));

    return {
      name: this.name,
      attributes: {
        enabled: String(this.isEnabled),
        samplingRate: String(clampedRate),
      },
    };
  }
}
