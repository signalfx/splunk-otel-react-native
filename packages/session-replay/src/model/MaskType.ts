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
 * Describes the type of a recording mask element.
 *
 * Elements are layered by array index (lowest to highest).
 * A {@link MaskType.COVERING} element hides a screen area, while
 * an {@link MaskType.ERASING} element reveals a previously covered area.
 */
export enum MaskType {
  /** Covers the area, hiding its content in the replay. */
  COVERING = 'covering',
  /** Erases (reveals) the area, undoing a lower-layer covering mask. */
  ERASING = 'erasing',
}
