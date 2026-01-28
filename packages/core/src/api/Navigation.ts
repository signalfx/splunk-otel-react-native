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

import { SplunkNativeBridge as Native } from '../sdk/SplunkNativeBridge';

/**
 * Navigation tracking.
 *
 * Manually track screen transitions when automatic detection is unavailable.
 */
export class Navigation {
  /**
   * Tracks a screen navigation event.
   *
   * Creates a span representing the screen view.
   *
   * @param screenName - Name of the screen being navigated to.
   */
  async track(screenName: string): Promise<void> {
    return Native.navigationTrack(screenName);
  }
}
