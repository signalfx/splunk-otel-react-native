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

import type { MaskType } from './MaskType';

/** A rectangular area on screen. */
export interface MaskRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A single element of a recording mask.
 *
 * Elements are layered by array index; a {@link MaskType.COVERING}
 * element can be partially revealed by a higher-layer
 * {@link MaskType.ERASING} element.
 */
export interface MaskElement {
  rect: MaskRect;
  type: MaskType;
}

/**
 * A collection of mask elements that define which screen areas
 * are hidden or revealed in the session replay recording.
 */
export interface RecordingMask {
  elements: MaskElement[];
}
