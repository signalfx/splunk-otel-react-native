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

export { SplunkRum } from './api/SplunkRum';
export { SplunkRumProvider } from './providers/SplunkRumProvider';
export type { AgentConfiguration } from './model/configuration/AgentConfiguration';
export type { EndpointConfiguration } from './model/configuration/EndpointConfiguration';
export type {
  SplunkRumState,
  SplunkRumStatus,
  SessionState,
  UserState,
  UserTrackingMode,
} from './api/State';
export { ModuleConfiguration } from './model/modules/ModuleConfiguration';
export { AnrModuleConfiguration } from './model/modules/AnrModuleConfiguration';
export { ApplicationLifecycleModuleConfiguration } from './model/modules/ApplicationLifecycleModuleConfiguration';
export { CrashReportsModuleConfiguration } from './model/modules/CrashReportsModuleConfiguration';
export { HttpURLModuleConfiguration } from './model/modules/HttpURLModuleConfiguration';
export { InteractionsModuleConfiguration } from './model/modules/InteractionsModuleConfiguration';
export { NavigationModuleConfiguration } from './model/modules/NavigationModuleConfiguration';
export { NetworkMonitorModuleConfiguration } from './model/modules/NetworkMonitorModuleConfiguration';
export { OkHttp3AutoModuleConfiguration } from './model/modules/OkHttp3AutoModuleConfiguration';
export { OkHttp3ManualModuleConfiguration } from './model/modules/OkHttp3ManualModuleConfiguration';
export { SlowRenderingModuleConfiguration } from './model/modules/SlowRenderingModuleConfiguration';
export { StartupModuleConfiguration } from './model/modules/StartupModuleConfiguration';
export { NetworkInstrumentationModuleConfiguration } from './model/modules/NetworkInstrumentationModuleConfiguration';
export { MutableAttributes } from './model/attributes/MutableAttributes';
export { SplunkWebView } from './components/SplunkWebView';
export type { SplunkWebViewProps } from './components/SplunkWebView';
export {
  SDK_VERSION,
  ATTR_RN_FRAMEWORK_VERSION,
  ATTR_RN_SDK_VERSION,
  getReactNativeVersion,
  getSdkVersion,
  getSdkVersionInfo,
} from './version';
export type { SdkVersionInfo } from './version';
