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

import type { Attributes } from '@opentelemetry/api';
import { SplunkNativeBridge as Native } from '../sdk/SplunkNativeBridge';

/**
 * Attribute keys reserved by the native navigation module. The native modules
 * set these on the navigation span themselves; stripping them here keeps
 * behavior identical across platforms (iOS strips them, Android does not) and
 * prevents a route param from overwriting them.
 */
const RESERVED_NAVIGATION_ATTRIBUTE_KEYS: ReadonlySet<string> = new Set([
  'component',
  'navigation.name',
  'screen.name',
  'last.screen.name',
]);

function sanitizeNavigationAttributes(attributes?: Attributes): Attributes {
  if (!attributes) {
    return {};
  }

  const sanitized: Attributes = {};
  for (const key of Object.keys(attributes)) {
    if (!RESERVED_NAVIGATION_ATTRIBUTE_KEYS.has(key)) {
      sanitized[key] = attributes[key];
    }
  }

  return sanitized;
}

/**
 * Navigation tracking.
 *
 * Manually track screen transitions, or feed an automatic detector
 * (see the `react-navigation` integration).
 */
export class Navigation {
  /**
   * Tracks a screen navigation event.
   *
   * Creates a span representing the screen view and updates the shared
   * current-screen context that the native SDKs stamp onto all other
   * telemetry (errors, crashes, network spans, session replay).
   *
   * @param screenName - Name of the screen being navigated to.
   * @param attributes - Optional attributes to attach (e.g. route params).
   *   Reserved keys (`component`, `navigation.name`, `screen.name`,
   *   `last.screen.name`) are ignored.
   */
  async track(screenName: string, attributes?: Attributes): Promise<void> {
    return Native.navigationTrack(
      screenName,
      sanitizeNavigationAttributes(attributes)
    );
  }
}
