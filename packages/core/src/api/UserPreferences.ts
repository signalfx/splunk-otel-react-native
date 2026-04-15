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

import type { UserTrackingMode } from './State';
import { SplunkNativeBridge as Native } from '../sdk/SplunkNativeBridge';

/**
 * User tracking preferences.
 */
export class UserPreferences {
  /**
   * Returns the current user tracking mode.
   *
   * @returns The active tracking mode: `NO_TRACKING` or `ANONYMOUS_TRACKING`.
   */
  async getTrackingMode(): Promise<UserTrackingMode> {
    const state = await Native.getUserState();
    return state.trackingMode;
  }

  /**
   * Sets user tracking mode.
   *
   * @param mode - Tracking mode or `null` to reset.
   *   - `NO_TRACKING`: No user identifier generated.
   *   - `ANONYMOUS_TRACKING`: Generates anonymous user ID per session.
   */
  async setTrackingMode(mode: UserTrackingMode | null): Promise<void> {
    return Native.setUserTrackingMode(mode);
  }
}
