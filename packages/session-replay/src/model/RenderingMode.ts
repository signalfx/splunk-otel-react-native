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
 * How screen data is captured.
 *
 * This changes what masking means, so it is worth knowing which mode is
 * active before relying on a privacy setting.
 */
export enum RenderingMode {
  /**
   * Captures the rendered screen as video. Sensitive areas are covered by the
   * masking pattern before the frame is encoded. Recording masks apply.
   */
  NATIVE = 'native',

  /**
   * Captures a structural description of the screen instead of pixels.
   * Sensitive text is emitted as plain colour blocks rather than characters,
   * and recording masks are **not** applied.
   */
  WIREFRAME_ONLY = 'wireframeOnly',
}
