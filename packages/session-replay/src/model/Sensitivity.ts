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
 * Effective sensitivity of a native view class.
 *
 * Sensitivity is tri-state on both platforms: an explicit `true`/`false`, or
 * "unset", in which case the value is inherited from the nearest superclass
 * that does have a value, and finally from the SDK default.
 */
export enum Sensitivity {
  /** Explicitly sensitive - the area is replaced by the masking pattern. */
  SENSITIVE = 'sensitive',
  /** Explicitly not sensitive - overrides any inherited default. */
  NOT_SENSITIVE = 'notSensitive',
  /** No explicit value - inherits from the superclass chain / SDK default. */
  UNSET = 'unset',
}
