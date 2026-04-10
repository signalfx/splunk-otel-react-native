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

/**
 * Determines how session replay captures and renders screen content.
 *
 * @example
 * ```typescript
 * import { RenderingMode } from '@splunk/otel-session-replay-react-native';
 *
 * await SplunkSessionReplay.instance.setPreferences({
 *   renderingMode: RenderingMode.WIREFRAME_ONLY,
 * });
 * ```
 */
export enum RenderingMode {
  /** Screenshot-based recording with wireframe overlay. */
  NATIVE = 'native',
  /** Wireframe representation only; no screen images are captured. */
  WIREFRAME_ONLY = 'wireframeOnly',
}
