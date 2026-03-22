import { useCallback, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import {
  SplunkRumProvider,
  StartupModuleConfiguration,
  type AgentConfiguration,
  ApplicationLifecycleModuleConfiguration,
  InteractionsModuleConfiguration,
  NavigationModuleConfiguration,
  NetworkMonitorModuleConfiguration,
  SlowRenderingModuleConfiguration,
  AnrModuleConfiguration,
  HttpURLModuleConfiguration,
  OkHttp3AutoModuleConfiguration,
  OkHttp3ManualModuleConfiguration,
  NetworkInstrumentationModuleConfiguration,
  ATTR_RN_FRAMEWORK_VERSION,
  ATTR_RN_SDK_VERSION,
  getReactNativeVersion,
  getSdkVersion,
} from '@splunk/otel-react-native';

import { RootNavigator } from './navigation/RootNavigator';
import { config as appConfig, isConfigValid } from './config';

enableScreens(true);

console.log(`[Config] Valid: ${isConfigValid()}`);

// SDK Configuration using external config
const agentConfig: AgentConfiguration = {
  endpoint: {
    realm: appConfig.realm,
    rumAccessToken: appConfig.rumAccessToken,
  },
  appName: appConfig.appName,
  deploymentEnvironment: appConfig.deploymentEnvironment,
  appVersion: '1.0.0',
  enableDebugLogging: appConfig.enableDebugLogging,
  globalAttributes: {
    'app.type': 'test',
    'app.framework': 'react-native',
    [ATTR_RN_FRAMEWORK_VERSION]: getReactNativeVersion(),
    [ATTR_RN_SDK_VERSION]: getSdkVersion(),
  },
  user: { trackingMode: 'NO_TRACKING' },
  session: { samplingRate: 1.0 },
  deferredUntilForeground: false,
};

const modules = [
  new ApplicationLifecycleModuleConfiguration(true),
  new InteractionsModuleConfiguration(true),
  new NavigationModuleConfiguration(true, true),
  new NetworkMonitorModuleConfiguration(true),
  new SlowRenderingModuleConfiguration(true, 1000),
  new StartupModuleConfiguration(),
  new AnrModuleConfiguration(true),
  new HttpURLModuleConfiguration(
    true,
    ['Content-Type', 'Accept'],
    ['Server', 'Content-Type']
  ),
  new OkHttp3AutoModuleConfiguration(
    true,
    ['Content-Type', 'Accept'],
    ['Server', 'Content-Type']
  ),
  new OkHttp3ManualModuleConfiguration(
    ['Content-Type', 'Accept'],
    ['Server', 'Content-Type']
  ),
  new NetworkInstrumentationModuleConfiguration(true),
];

export default function App() {
  const [installed, setInstalled] = useState(false);

  const onReady = useCallback(async () => {
    try {
      setInstalled(true);
      console.log('[App] SDK initialized successfully');
    } catch (e: any) {
      console.error('[App] SDK initialization error:', e?.message ?? String(e));
    }
  }, []);

  return (
    <SplunkRumProvider
      agentConfiguration={agentConfig}
      modules={modules}
      onReady={onReady}
      setGlobalAttributes={{ 'app.init': 'provider' }}
      setUser={{ trackingMode: 'NO_TRACKING' }}
    >
      <NavigationContainer>
        <RootNavigator installed={installed} />
      </NavigationContainer>
    </SplunkRumProvider>
  );
}
