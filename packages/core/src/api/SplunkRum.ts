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

import { SplunkNativeBridge as Native } from '../sdk/SplunkNativeBridge';
import type { AgentConfiguration } from '../model/configuration/AgentConfiguration';
import type { ModuleConfiguration } from '../model/modules/ModuleConfiguration';
import type { SplunkRumState } from './State';
import { Session } from './Session';
import { User } from './User';
import { CustomTracking } from './CustomTracking';
import { Navigation } from './Navigation';
import { AgentPreferences } from './AgentPreferences';
import { MutableAttributes } from '../model/attributes/MutableAttributes';
import {
  toNativeAgentConfiguration,
  toNativeModules,
  fromNativeState,
} from '../bridge/converters';

/**
 * Splunk RUM SDK entry point.
 *
 * Use `SplunkRum.install()` to initialize the SDK, then access features
 * via `SplunkRum.instance`.
 *
 * @example Basic usage with endpoint
 * ```typescript
 * await SplunkRum.install({
 *   endpoint: { realm: 'us0', rumAccessToken: 'YOUR_TOKEN' },
 *   appName: 'MyApp',
 *   deploymentEnvironment: 'production',
 * });
 * ```
 *
 * @example Deferred endpoint configuration
 * ```typescript
 * await SplunkRum.install({
 *   appName: 'MyApp',
 *   deploymentEnvironment: 'production',
 * });
 *
 * // Configure endpoint later via preferences
 * await SplunkRum.instance.preferences.setEndpointConfiguration({
 *   realm: 'us0',
 *   rumAccessToken: 'YOUR_TOKEN',
 * });
 * ```
 */
export class SplunkRum {
  private static _instance: SplunkRum | null = null;

  /**
   * Installs the Splunk RUM SDK.
   *
   * Call once at app startup before accessing other SDK features.
   *
   * @param configuration - Agent configuration.
   * @param modules - Optional module configurations for features.
   *
   * @example With modules
   * ```typescript
   * await SplunkRum.install(config, [
   *   new SlowRenderingModuleConfiguration(true, 1000),
   * ]);
   * ```
   */
  static async install(
    configuration: AgentConfiguration,
    modules?: ModuleConfiguration[]
  ): Promise<void> {
    const nativeConfig = toNativeAgentConfiguration(configuration);
    const nativeModules = toNativeModules(
      modules,
      !!configuration.enableDebugLogging
    );

    await Native.install(nativeConfig, nativeModules);

    if (!this._instance) this._instance = new SplunkRum();
  }

  /**
   * SDK singleton instance.
   *
   * Access after calling `install()`.
   */
  static get instance(): SplunkRum {
    if (!this._instance) this._instance = new SplunkRum();

    return this._instance!;
  }

  /**
   * Agent preferences for runtime configuration.
   *
   * Allows configuring settings like endpoint after initialization.
   */
  readonly preferences = new AgentPreferences();

  /**
   * Global attributes sent with all signals.
   *
   * Thread-safe mutable collection for enriching telemetry data.
   */
  readonly globalAttributes = new MutableAttributes();

  /**
   * Session management.
   *
   * Provides access to session ID and sampling rate.
   */
  readonly session = new Session();

  /**
   * User tracking management.
   *
   * Controls user identification mode.
   */
  readonly user = new User();

  /**
   * Current agent runtime state.
   *
   * Reflects status, configuration, and endpoint settings.
   */
  get state(): Promise<SplunkRumState> {
    return Native.getState().then(fromNativeState);
  }

  /**
   * Gets current agent state.
   */
  getState(): Promise<SplunkRumState> {
    return this.state;
  }

  /**
   * Custom event and workflow tracking.
   *
   * Track business events and measure workflow durations.
   * Corresponds to native `CustomTracking` on both platforms.
   */
  readonly customTracking = new CustomTracking();

  /**
   * Navigation tracking.
   *
   * Manually track screen transitions when automatic detection is unavailable.
   */
  readonly navigation = new Navigation();

  /**
   * Integrates a WebView with Browser RUM.
   *
   * Injects a JavaScript interface (`window.SplunkRumNative`) to link the
   * native RUM session with browser-based RUM running in the WebView.
   * The Browser RUM agent uses this to correlate web and native sessions.
   *
   * Works with both `android.webkit.WebView` and `WKWebView` on iOS.
   *
   * @param viewTag - React Native native view tag (number).
   *
   * @remarks
   * **Recommended:** Use {@link SplunkWebView} wrapper component instead
   * for automatic integration without manual view tag handling.
   *
   * For manual integration, the view tag can be obtained from a ref.
   * For `react-native-webview`, access the internal `webViewRef` property.
   *
   * @example Using SplunkWebView (recommended)
   * ```tsx
   * import { WebView } from 'react-native-webview';
   * import { SplunkWebView } from '@splunk/otel-react-native';
   *
   * <SplunkWebView
   *   WebViewComponent={WebView}
   *   source={{ uri: 'https://example.com' }}
   * />
   * ```
   *
   * @example Manual integration with react-native-webview ref
   * ```tsx
   * import { WebView } from 'react-native-webview';
   *
   * const webViewRef = useRef<WebView>(null);
   *
   * const onLoadEnd = () => {
   *   const nativeRef = (webViewRef.current as any)?.webViewRef?.current;
   *   const viewTag = nativeRef?._nativeTag;
   *   if (viewTag) {
   *     SplunkRum.instance.integrateWebViewWithBrowserRum(viewTag);
   *   }
   * };
   *
   * <WebView
   *   ref={webViewRef}
   *   onLoadEnd={onLoadEnd}
   *   source={{ uri: 'https://example.com' }}
   * />
   * ```
   */
  integrateWebViewWithBrowserRum(viewTag: number): Promise<void> {
    return Native.integrateWebViewWithBrowserRum(viewTag);
  }
}
