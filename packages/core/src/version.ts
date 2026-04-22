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

import { Platform } from 'react-native';

/**
 * The version of the `@splunk/otel-react-native` SDK package.
 */
export const SDK_VERSION = '1.0.0-alpha.1';

/**
 * OTel attribute key for the React Native framework version used by the app.
 */
export const ATTR_RN_FRAMEWORK_VERSION = 'splunk.app.framework.rn.version';

/**
 * OTel attribute key for the React Native Agent version.
 */
export const ATTR_RN_SDK_VERSION = 'rum.sdk.rn.version';

/**
 * Version information for the Splunk OTel React Native SDK.
 */
export interface SdkVersionInfo {
  /** React Native framework version (e.g. "0.81.1"). */
  reactNativeVersion: string;

  /** `@splunk/otel-react-native` package version (e.g. "0.1.0"). */
  sdkVersion: string;
}

/**
 * Returns the React Native framework version from `Platform.constants`.
 *
 * Falls back to `"unknown"` when the version object is unavailable
 * (e.g. in test environments without a full RN runtime).
 */
export function getReactNativeVersion(): string {
  const rnVersion = Platform.constants?.reactNativeVersion;
  if (!rnVersion) {
    return 'unknown';
  }

  const { major, minor, patch } = rnVersion;
  const base = `${major}.${minor}.${patch}`;

  const prerelease = (rnVersion as { prerelease?: string | null }).prerelease;
  if (prerelease) {
    return `${base}-${prerelease}`;
  }

  return base;
}

/**
 * Returns the `@splunk/otel-react-native` SDK version.
 */
export function getSdkVersion(): string {
  return SDK_VERSION;
}

/**
 * Collects all version information relevant to the RN telemetry layer.
 */
export function getSdkVersionInfo(): SdkVersionInfo {
  return {
    reactNativeVersion: getReactNativeVersion(),
    sdkVersion: getSdkVersion(),
  };
}
