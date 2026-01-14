import { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  Alert,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  SplunkRum,
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
  UrlSessionModuleConfiguration,
} from '@splunk/otel-react-native';

import { TestCategory, MobilePlatform, type TestAction } from './types';
import { TestActionsWidget, StatusBar } from './components';
import { NativeTestBridge } from './NativeTestBridge';
import { runApiAssertionTests, type ApiTestReport } from './ApiAssertions';

// Configuration
const config: AgentConfiguration = {
  endpoint: {
    realm: 'mon0',
    rumAccessToken: 'jzn-AT776tR8NvkgXSbQ5g',
  },
  appName: 'Splunk RN Test App',
  deploymentEnvironment: 'dev',
  appVersion: '1.0.0',
  enableDebugLogging: true,
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
  new UrlSessionModuleConfiguration(true),
];

export default function App() {
  const [installed, setInstalled] = useState(false);
  const [testReport, setTestReport] = useState<ApiTestReport | null>(null);
  const [showReport, setShowReport] = useState(false);

  const testActions = useMemo<TestAction[]>(
    () => [
      // API Tests
      {
        id: 'api-full-test',
        title: 'Run Full API Test Suite',
        description: 'Runs comprehensive API tests with assertions',
        category: TestCategory.ApiTests,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          const report = await runApiAssertionTests();
          setTestReport(report);
          setShowReport(true);
        },
      },

      // Crashes
      {
        id: 'crash-native',
        title: 'Simulate Native Crash',
        description: 'Crashes the app to test crash reporting',
        category: TestCategory.Crashes,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          Alert.alert('Warning', 'This will crash the app. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Crash',
              style: 'destructive',
              onPress: () => NativeTestBridge.simulateCrash(),
            },
          ]);
        },
      },
      {
        id: 'crash-js',
        title: 'Simulate JS Exception',
        description: 'Throws a JavaScript exception',
        category: TestCategory.Crashes,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          throw new Error('Test JS exception from example app');
        },
      },

      // Performance
      {
        id: 'perf-slow-render',
        title: 'Simulate Slow Render',
        description: 'Simulates slow rendering (30ms delay)',
        category: TestCategory.Performance,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          await NativeTestBridge.simulateSlowRender();
          Alert.alert('Slow Render', 'Slow rendering simulation started');
        },
      },
      {
        id: 'perf-frozen-render',
        title: 'Simulate Frozen Render',
        description: 'Simulates frozen rendering (800ms delay)',
        category: TestCategory.Performance,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          await NativeTestBridge.simulateFrozenRender();
          Alert.alert('Frozen Render', 'Frozen rendering simulation started');
        },
      },
      {
        id: 'perf-anr',
        title: 'Trigger ANR',
        description: 'Blocks main thread for 10 seconds (Android only)',
        category: TestCategory.Performance,
        platforms: new Set([MobilePlatform.Android]),
        onTap: async () => {
          Alert.alert(
            'Warning',
            'This will freeze the app for 10 seconds. Continue?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Trigger ANR',
                style: 'destructive',
                onPress: () => NativeTestBridge.simulateANR(),
              },
            ]
          );
        },
      },

      // Network
      {
        id: 'network-okhttp',
        title: 'OkHttp GET Request',
        description: 'Network interception via OkHttp',
        category: TestCategory.Network,
        platforms: new Set([MobilePlatform.Android]),
        onTap: async () => {
          const result = await NativeTestBridge.testOkHttpGet();
          Alert.alert('OkHttp', result);
        },
      },
      {
        id: 'network-httpurl',
        title: 'HttpURLConnection GET',
        description: 'Network interception via HttpURLConnection',
        category: TestCategory.Network,
        platforms: new Set([MobilePlatform.Android]),
        onTap: async () => {
          const result = await NativeTestBridge.testHttpUrlConnectionGet();
          Alert.alert('HttpURLConnection', result);
        },
      },
      {
        id: 'network-urlsession',
        title: 'URLSession GET Request',
        description: 'Network interception via iOS URLSession',
        category: TestCategory.Network,
        platforms: new Set([MobilePlatform.iOS]),
        onTap: async () => {
          const result = await NativeTestBridge.testURLSessionGet();
          Alert.alert('URLSession', result);
        },
      },
      {
        id: 'network-fetch',
        title: 'Fetch API Request',
        description: 'Network request via JS fetch API',
        category: TestCategory.Network,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          try {
            const response = await fetch('https://httpbin.org/get');
            const status = response.status;
            Alert.alert('Fetch', `Request completed with status: ${status}`);
          } catch (e: any) {
            Alert.alert('Fetch Error', e?.message ?? String(e));
          }
        },
      },

      // Navigation
      {
        id: 'nav-simulate',
        title: 'Simulate Navigation',
        description: 'Track navigation to a random screen',
        category: TestCategory.Navigation,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          const screenNumber = Math.floor(Math.random() * 1000) + 1;
          const screenName = `mockScreen${screenNumber}`;

          // Note: navigation tracking will typically be done via navigation library integration
          // This is a placeholder for demonstration
          await SplunkRum.instance.customTracking.trackCustomEvent(
            'screen.view',
            {
              'screen.name': screenName,
            }
          );
          Alert.alert('Navigation', `Tracked navigation to: ${screenName}`);
        },
      },

      // Custom Tracking
      {
        id: 'custom-event',
        title: 'Track Custom Event',
        description: 'Track a custom event with attributes',
        category: TestCategory.CustomTracking,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          const eventNumber = Math.floor(Math.random() * 1000) + 1;
          await SplunkRum.instance.customTracking.trackCustomEvent(
            `test_custom_event_${eventNumber}`,
            {
              'event.number': eventNumber,
              'event.source': 'test_app',
              'event.timestamp': Date.now(),
            }
          );
          Alert.alert('Custom Event', `Event #${eventNumber} tracked`);
        },
      },
      {
        id: 'custom-workflow',
        title: 'Track Workflow',
        description: 'Start and end a workflow span',
        category: TestCategory.CustomTracking,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          const handle =
            await SplunkRum.instance.customTracking.startWorkflow(
              'test_workflow'
            );
          setTimeout(async () => {
            await handle.end();
            Alert.alert('Workflow', 'Workflow completed (1.5s duration)');
          }, 1500);
          Alert.alert('Workflow', 'Workflow started (auto-ends in 1.5s)');
        },
      },
      // Session
      {
        id: 'session-info',
        title: 'Get Session Info',
        description: 'Display current session information',
        category: TestCategory.Session,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          const session = await SplunkRum.instance.session.state();
          const user = await SplunkRum.instance.user.state();
          Alert.alert(
            'Session Info',
            `Session ID: ${session.id}\nSampling Rate: ${session.samplingRate}\nUser Tracking: ${user.trackingMode}`
          );
        },
      },
      {
        id: 'session-user-anon',
        title: 'Set Anonymous Tracking',
        description: 'Set user tracking mode to anonymous',
        category: TestCategory.Session,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          await SplunkRum.instance.user.preferences.setTrackingMode(
            'ANONYMOUS_TRACKING'
          );
          const user = await SplunkRum.instance.user.state();
          Alert.alert('User Tracking', `Mode set to: ${user.trackingMode}`);
        },
      },
      {
        id: 'session-user-none',
        title: 'Set No Tracking',
        description: 'Set user tracking mode to none',
        category: TestCategory.Session,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          await SplunkRum.instance.user.preferences.setTrackingMode(
            'NO_TRACKING'
          );
          const user = await SplunkRum.instance.user.state();
          Alert.alert('User Tracking', `Mode set to: ${user.trackingMode}`);
        },
      },

      // Global Attributes
      {
        id: 'ga-set',
        title: 'Set Demo Attributes',
        description: 'Set various global attributes',
        category: TestCategory.GlobalAttributes,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          const ga = SplunkRum.instance.globalAttributes;
          await ga.setString('user.name', 'TestUser');
          await ga.setNumber('user.age', 25);
          await ga.setBoolean('user.premium', true);
          await ga.setArray('user.tags', ['mobile', 'react-native', 'test']);
          Alert.alert('Global Attributes', 'Demo attributes set');
        },
      },
      {
        id: 'ga-get-all',
        title: 'Get All Attributes',
        description: 'Display all global attributes',
        category: TestCategory.GlobalAttributes,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          const all = await SplunkRum.instance.globalAttributes.getAll();
          const text = Object.entries(all)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join('\n');
          Alert.alert('Global Attributes', text || '(empty)');
        },
      },
      {
        id: 'ga-clear',
        title: 'Clear All Attributes',
        description: 'Remove all global attributes',
        category: TestCategory.GlobalAttributes,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          await SplunkRum.instance.globalAttributes.removeAll();
          Alert.alert('Global Attributes', 'All attributes cleared');
        },
      },
    ],
    []
  );

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
      agentConfiguration={config}
      modules={modules}
      onReady={onReady}
      setGlobalAttributes={{ 'app.init': 'provider' }}
      setUser={{ trackingMode: 'NO_TRACKING' }}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🔭 Splunk OTel RN Test App</Text>
          <Text style={styles.subtitle}>
            {installed ? '✓ SDK Installed' : '⏳ Initializing...'}
          </Text>
        </View>
        <StatusBar />
        <TestActionsWidget actions={testActions} />

        <Modal
          visible={showReport}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowReport(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>API Test Report</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowReport(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            {testReport && (
              <>
                <View style={styles.reportSummary}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>
                      {testReport.passed}
                    </Text>
                    <Text style={styles.summaryLabel}>Passed</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryNumber, styles.failedNumber]}>
                      {testReport.failed}
                    </Text>
                    <Text style={styles.summaryLabel}>Failed</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>
                      {testReport.duration}ms
                    </Text>
                    <Text style={styles.summaryLabel}>Duration</Text>
                  </View>
                </View>
                <ScrollView style={styles.reportList}>
                  {testReport.results.map((result, index) => (
                    <View
                      key={index}
                      style={[
                        styles.resultItem,
                        result.passed
                          ? styles.resultPassed
                          : styles.resultFailed,
                      ]}
                    >
                      <Text style={styles.resultTest}>[{result.testName}]</Text>
                      <Text style={styles.resultMessage}>{result.message}</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </SplunkRumProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D44',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#8888AA',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D44',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2D2D44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  reportSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D44',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4CAF50',
  },
  failedNumber: {
    color: '#FF5252',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8888AA',
    marginTop: 4,
  },
  reportList: {
    flex: 1,
    padding: 12,
  },
  resultItem: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  resultPassed: {
    backgroundColor: '#1B3329',
  },
  resultFailed: {
    backgroundColor: '#3D1F1F',
  },
  resultTest: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8888AA',
    marginBottom: 2,
  },
  resultMessage: {
    fontSize: 13,
    color: '#FFFFFF',
  },
});
