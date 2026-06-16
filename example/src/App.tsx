import { useCallback, useState } from 'react';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import {
  SplunkRumProvider,
  StartupModuleConfiguration,
  SessionReplayModuleConfiguration,
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
} from '@splunk/otel-react-native';

import { SplunkSessionReplay } from '@splunk/otel-session-replay-react-native';
import { reactNavigationIntegration } from '@splunk/otel-react-native/react-navigation';

import { RootNavigator } from './navigation/RootNavigator';
import { config as appConfig, isConfigValid } from './config';

enableScreens(true);

// Automatic navigation instrumentation for react-navigation. Detects focused
// route changes in JS and forwards them to the native navigation module, which
// emits the `app.ui.navigation` span and updates the shared `screen.name`.
const splunkNavigation = reactNavigationIntegration();

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
  },
  user: { trackingMode: 'NO_TRACKING' },
  session: { samplingRate: 1.0 },
  deferredUntilForeground: false,
};

const modules = [
  new ApplicationLifecycleModuleConfiguration(true),
  new InteractionsModuleConfiguration(true),
  // Native automatic tracking is OFF: in a React Native app it sees only the
  // host Activity / root view controller (and react-native-screens
  // containers), not the JS routes. The reactNavigationIntegration below feeds
  // the real JS screen names via the manual navigation API instead.
  new NavigationModuleConfiguration(true, false),
  new NetworkMonitorModuleConfiguration(true),
  new SlowRenderingModuleConfiguration(true, 1000),
  new StartupModuleConfiguration(),
  new AnrModuleConfiguration(true),
  new HttpURLModuleConfiguration(
    true,
    ['Content-Type', 'Accept', 'Content-Encoding'],
    ['Server', 'Content-Type', 'Content-Encoding']
  ),
  new OkHttp3AutoModuleConfiguration(
    true,
    ['Content-Type', 'Accept', 'Content-Encoding'],
    ['Server', 'Content-Type', 'Content-Encoding']
  ),
  new OkHttp3ManualModuleConfiguration(
    ['Content-Type', 'Accept', 'Content-Encoding'],
    ['Server', 'Content-Type', 'Content-Encoding']
  ),
  new NetworkInstrumentationModuleConfiguration(
    true,
    undefined,
    ['Content-Type', 'Accept', 'Content-Encoding'],
    ['Content-Type', 'Content-Encoding', 'Server']
  ),
  new SessionReplayModuleConfiguration(true, 1.0),
];

export default function App() {
  const [installed, setInstalled] = useState(false);
  const navigationRef = useNavigationContainerRef();

  const onReady = useCallback(async () => {
    try {
      setInstalled(true);
      console.log('[App] SDK initialized successfully');

      // Start tracking react-navigation now that the SDK is installed, so the
      // native navigation module is ready to receive screen events.
      splunkNavigation.registerNavigationContainer(navigationRef);

      await SplunkSessionReplay.instance.start();
      console.log('[App] Session Replay started');
    } catch (e: any) {
      console.error('[App] SDK initialization error:', e?.message ?? String(e));
    }
  }, [navigationRef]);

  return (
    <SplunkRumProvider
      agentConfiguration={agentConfig}
      modules={modules}
      onReady={onReady}
      setGlobalAttributes={{ 'app.init': 'provider' }}
      setUser={{ trackingMode: 'NO_TRACKING' }}
    >
      <NavigationContainer ref={navigationRef}>
        <RootNavigator installed={installed} />
      </NavigationContainer>
    </SplunkRumProvider>
  );
}
