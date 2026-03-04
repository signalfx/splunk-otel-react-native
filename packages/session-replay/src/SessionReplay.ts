/*
 * Copyright 2026 Splunk Inc.
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

import Native from './specs/NativeSplunkSessionReplay';

/**
 * Session Replay singleton API.
 *
 * TODO mooooore API
 *
 * @example
 * ```typescript
 * import { SplunkSessionReplay } from '@splunk/otel-session-replay-react-native';
 *
 * await SplunkSessionReplay.instance.start();
 * await SplunkSessionReplay.instance.stop();
 * ```
 */
export class SplunkSessionReplay {
  private static _instance: SplunkSessionReplay | null = null;

  private constructor() {}

  static get instance(): SplunkSessionReplay {
    if (!this._instance) this._instance = new SplunkSessionReplay();
    return this._instance;
  }

  /**
   * Starts session replay recording.
   *
   * If the SDK is not yet installed or session replay was not configured
   * during install, this is a no-op on the native side.
   */
  start(): Promise<void> {
    return Native.start();
  }

  /**
   * Stops the current session replay recording.
   */
  stop(): Promise<void> {
    return Native.stop();
  }
}
