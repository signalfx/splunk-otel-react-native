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

import type { Spec } from '../specs/NativeSplunkOtelReactNative';
import type { Attributes } from '@opentelemetry/api';
import type { UserTrackingMode } from '../api/State';

// Re-export types from specs for convenience
export type {
  AttributeScalar,
  AttributeArray,
  NativeAttributeValue,
  NativeAttributes,
  NativeEndpoint,
  NativeUser,
  NativeSession,
  NativeAgentConfiguration,
  NativeModuleConfiguration,
  NativeModuleConfigurations,
  NativeStatus,
  NativeState,
  NativeSessionState,
  NativeUserState,
} from '../specs/NativeSplunkOtelReactNative';

/**
 * Enhanced type overlay on top of the TurboModule Spec.
 *
 * Provides stronger TypeScript types that cannot be expressed in codegen specs
 * (e.g., union types, external types like Attributes from OpenTelemetry API).
 */
export interface SplunkNativeModuleType extends Spec {
  setUserTrackingMode(mode: UserTrackingMode | null): Promise<void>;

  globalAttributesSetAll(map: Attributes): Promise<number>;
  globalAttributesSetAllInNameSpace(
    nameSpace: string,
    map: Attributes
  ): Promise<number>;

  customTrackEvent(name: string, attributes: Attributes): Promise<void>;
}
