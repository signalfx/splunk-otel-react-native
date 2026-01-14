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

import {
  createContext,
  useEffect,
  useRef,
  useState,
  type FC,
  type PropsWithChildren,
} from 'react';

import type { AgentConfiguration } from '../model/configuration/AgentConfiguration';
import type { ModuleConfiguration } from '../model/modules/ModuleConfiguration';
import { SplunkRum } from '../api/SplunkRum';

type Props = PropsWithChildren<{
  /** Agent configuration. */
  agentConfiguration: AgentConfiguration;
  /** Optional module configurations. */
  modules?: ModuleConfiguration[];
  /** Callback invoked when SDK is ready. */
  onReady?: (rum: SplunkRum) => void;
  /** Initial global attributes to set. */
  setGlobalAttributes?: Record<string, unknown>;
  /** Initial user tracking settings. */
  setUser?: { trackingMode?: 'NO_TRACKING' | 'ANONYMOUS_TRACKING' };
}>;

/**
 * React context for SplunkRum instance.
 */
export const SplunkRumContext = createContext<SplunkRum | undefined>(undefined);

/**
 * React provider for Splunk RUM SDK.
 *
 * Wraps your app to initialize the SDK and provide context access.
 *
 * @example Basic usage
 * ```tsx
 * <SplunkRumProvider
 *   agentConfiguration={{
 *     endpoint: { realm: 'us0', rumAccessToken: 'TOKEN' },
 *     appName: 'MyApp',
 *     deploymentEnvironment: 'production',
 *   }}
 *   modules={[new SlowRenderingModuleConfiguration(true, 1000)]}
 *   onReady={(rum) => console.log('RUM ready')}
 * >
 *   <App />
 * </SplunkRumProvider>
 * ```
 *
 * @example With context hook
 * ```tsx
 * import { useContext } from 'react';
 *
 * function MyComponent() {
 *   const rum = useContext(SplunkRumContext);
 *   // Use rum.globalAttributes, rum.customTracking, etc.
 * }
 * ```
 */
export const SplunkRumProvider: FC<Props> = ({
  children,
  agentConfiguration,
  modules,
  onReady,
  setGlobalAttributes,
  setUser,
}) => {
  const [instance, setInstance] = useState<SplunkRum | undefined>(undefined);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (isInitializing.current) {
      return;
    }
    isInitializing.current = true;

    const doInstall = async () => {
      try {
        await SplunkRum.install(agentConfiguration, modules);
      } catch (error) {
        console.error('Error installing Splunk RUM', error);
      }

      const rum = SplunkRum.instance;

      if (setGlobalAttributes) {
        await rum.globalAttributes.setAll(
          setGlobalAttributes as Record<string, unknown> as any
        );
      }

      if (setUser) {
        await rum.user.preferences.setTrackingMode(
          setUser.trackingMode ?? null
        );
      }

      setInstance(rum);
      onReady?.(rum);
    };

    doInstall();
  }, [agentConfiguration, modules, onReady, setGlobalAttributes, setUser]);

  return (
    <SplunkRumContext.Provider value={instance}>
      {children}
    </SplunkRumContext.Provider>
  );
};
