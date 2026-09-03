import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
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
import { SplunkRum } from '@splunk/otel-react-native';
import { NativeTestBridge } from './NativeTestBridge';

enableScreens(true);

// Automatic navigation instrumentation for react-navigation. Detects focused
// route changes in JS and forwards them to the native navigation module, which
// emits the `app.ui.navigation` span and updates the shared `screen.name`.
const splunkNavigation = reactNavigationIntegration();

console.log(`[Config] Valid: ${isConfigValid()}`);

// Simulation hook for the iOS background-launch cold-start issue.
//
// The native React Native AppStartHandler anchors a cold start at the real (BSD)
// process-start time and, per the Confluence design doc (section 3.4), the manual
// `appStart.track(...)` path completes the span at the moment JS invokes tracking,
// i.e. right after SplunkRum.install(). On a real iOS background launch the process
// starts long before JavaScript boots and installs, so the whole gap is reported as
// cold-start latency.
//
// We reproduce that anchoring deterministically (no APNs and no real background
// launch needed) by delaying when the SplunkRumProvider mounts, which delays
// install(). Set the delay (in seconds) at build time so it is inlined into the
// bundle:
//   SPLUNK_INSTALL_DELAY_SECONDS=25 yarn ios --device ...
const INSTALL_DELAY_SECONDS = Number.parseInt(
  process.env.SPLUNK_INSTALL_DELAY_SECONDS ?? '0',
  10
);

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
  // When a delay is configured, hold off mounting SplunkRumProvider (and thus
  // install()) so the process-start -> install gap is inflated on purpose.
  const [readyToInstall, setReadyToInstall] = useState(
    INSTALL_DELAY_SECONDS <= 0
  );
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (INSTALL_DELAY_SECONDS <= 0) {
      return;
    }

    console.log(
      `[AppStart] Delaying SplunkRum.install() by ${INSTALL_DELAY_SECONDS}s ` +
        'to simulate a late SDK init after an early process start.'
    );
    const timer = setTimeout(() => {
      setReadyToInstall(true);
    }, INSTALL_DELAY_SECONDS * 1000);

    return () => clearTimeout(timer);
  }, []);

  const onReady = useCallback(async () => {
    try {
      setInstalled(true);
      console.log('[App] SDK initialized successfully');

      // Start tracking react-navigation now that the SDK is installed, so the
      // native navigation module is ready to receive screen events.
      splunkNavigation.registerNavigationContainer(navigationRef);

      await SplunkSessionReplay.instance.start();
      console.log('[App] Session Replay started');

      // Repro helper: release-build JS logs are not visible over the CLI, so
      // persist the session id to a file that can be pulled from a real device
      // with `devicectl device copy from` to look the session up in the RUM UI.
      try {
        const session = await SplunkRum.instance.session.state();
        if (session?.id && NativeTestBridge.isAvailable) {
          await NativeTestBridge.persistSessionId(session.id);
          console.log('[App] Persisted session id:', session.id);
        }
      } catch (persistError: any) {
        console.warn(
          '[App] Failed to persist session id:',
          persistError?.message ?? String(persistError)
        );
      }
    } catch (e: any) {
      console.error('[App] SDK initialization error:', e?.message ?? String(e));
    }
  }, [navigationRef]);

  if (!readyToInstall) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>
          {`Delaying SplunkRum.install() by ${INSTALL_DELAY_SECONDS}s\n(background-launch cold-start simulation)`}
        </Text>
      </View>
    );
  }

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
