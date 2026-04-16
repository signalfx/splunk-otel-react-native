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
import type { AgentConfiguration } from '../model/configuration/AgentConfiguration';
import type { EndpointConfiguration } from '../model/configuration/EndpointConfiguration';
import type { ModuleConfiguration } from '../model/modules/ModuleConfiguration';
import type { SplunkRumState } from '../api/State';
import type {
  NativeAgentConfiguration,
  NativeEndpoint,
  NativeModuleConfigurations,
  NativeState,
  NativeAttributes,
} from '../specs/NativeSplunkOtelReactNative';
import {
  ATTR_RN_FRAMEWORK_VERSION,
  ATTR_RN_SDK_VERSION,
  getReactNativeVersion,
  getSdkVersion,
} from '../version';

export function toNativeEndpoint(
  endpoint: EndpointConfiguration
): NativeEndpoint {
  if ('realm' in endpoint) {
    return { realm: endpoint.realm, rumAccessToken: endpoint.rumAccessToken };
  }

  return {
    trace: endpoint.trace,
    sessionReplay: endpoint.sessionReplay,
  };
}

export function toNativeAgentConfiguration(
  configuration: AgentConfiguration
): NativeAgentConfiguration {
  return {
    endpoint: configuration.endpoint
      ? toNativeEndpoint(configuration.endpoint)
      : null,
    appName: configuration.appName,
    deploymentEnvironment: configuration.deploymentEnvironment,
    appVersion: configuration.appVersion ?? null,
    enableDebugLogging: !!configuration.enableDebugLogging,
    globalAttributes: {
      ...(configuration.globalAttributes ?? {}),
      [ATTR_RN_FRAMEWORK_VERSION]: getReactNativeVersion(),
      [ATTR_RN_SDK_VERSION]: getSdkVersion(),
    } as Attributes as NativeAttributes,
    user: { trackingMode: configuration.user?.trackingMode ?? null },
    session: {
      samplingRate: clampSamplingRate(
        configuration.session?.samplingRate ?? 1.0
      ),
    },
    instrumentedProcessName: configuration.instrumentedProcessName ?? null,
    deferredUntilForeground: !!configuration.deferredUntilForeground,
  };
}

export function toNativeModules(
  modules?: ModuleConfiguration[]
): NativeModuleConfigurations {
  if (!modules || modules.length === 0) return [];

  return modules.map((m) => m.toNative());
}

export function fromNativeEndpoint(
  ep: NativeEndpoint | null | undefined
): EndpointConfiguration | undefined {
  if (!ep) return undefined;

  if (ep.realm) {
    return {
      realm: String(ep.realm),
      rumAccessToken: String(ep.rumAccessToken ?? ''),
    };
  }

  if (!ep.trace) return undefined;

  return {
    trace: String(ep.trace),
    sessionReplay:
      ep.sessionReplay != null ? String(ep.sessionReplay) : undefined,
  };
}

export function fromNativeState(native: NativeState): SplunkRumState {
  const status =
    native.status?.type === 'Running'
      ? { type: 'Running' as const }
      : {
          type: 'NotRunning' as const,
          reason:
            native.status && native.status.type === 'NotRunning'
              ? native.status.reason
              : 'NotInstalled',
        };

  return {
    appName: String(native.appName ?? ''),
    appVersion: String(native.appVersion ?? ''),
    deploymentEnvironment: String(native.deploymentEnvironment ?? ''),
    status,
    endpoint: fromNativeEndpoint(native.endpoint) ?? undefined,
    isDebugLoggingEnabled: !!native.isDebugLoggingEnabled,
    instrumentedProcessName: native.instrumentedProcessName ?? null,
    deferredUntilForeground: !!native.deferredUntilForeground,
  };
}

/** Clamps a sampling rate to the valid [0, 1] range. */
export function clampSamplingRate(rate: number): number {
  return Math.min(1, Math.max(0, rate));
}
