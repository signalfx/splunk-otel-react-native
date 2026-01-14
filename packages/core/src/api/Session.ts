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

import type { SessionState } from './State';
import { SplunkNativeBridge as Native } from '../sdk/SplunkNativeBridge';

/**
 * Session management.
 *
 * Provides access to current session ID and sampling rate.
 */
export class Session {
  /**
   * Gets current session state.
   *
   * @returns Session ID and sampling rate.
   */
  async state(): Promise<SessionState> {
    return Native.getSessionState();
  }
}
