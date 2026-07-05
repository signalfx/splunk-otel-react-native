import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  SplunkRum,
  ErrorSource,
  type EndpointConfiguration,
} from '@splunk/otel-react-native';
import {
  SplunkSessionReplay,
  MaskType,
} from '@splunk/otel-session-replay-react-native';
import { config as appConfig } from '../config';

import { TestCategory, MobilePlatform, type TestAction } from '../types';
import { TestActionsWidget, StatusBar, SessionIdBar } from '../components';
import { NativeTestBridge } from '../NativeTestBridge';
import { runApiAssertionTests, type ApiTestReport } from '../ApiAssertions';
import type {
  RootStackParamList,
  TabParamList,
  TestsStackParamList,
} from '../navigation/types';

type Props = NativeStackScreenProps<TestsStackParamList, 'Home'> & {
  installed: boolean;
};

export const HomeScreen: React.FC<Props> = ({ navigation, installed }) => {
  const [testReport, setTestReport] = useState<ApiTestReport | null>(null);
  const [showReport, setShowReport] = useState(false);

  const tabNavigation =
    navigation.getParent<BottomTabNavigationProp<TabParamList>>();
  const rootNavigation =
    tabNavigation?.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const openNavigationLab = useCallback(() => {
    tabNavigation?.navigate('NavigationTab', { screen: 'NavHome' });
  }, [tabNavigation]);

  const openNavigationDetail = useCallback(() => {
    const itemId = Math.floor(Math.random() * 900) + 100;
    tabNavigation?.navigate('NavigationTab', {
      screen: 'ItemDetail',
      params: { itemId, title: `Item ${itemId}` },
    });
  }, [tabNavigation]);

  const openRootModal = useCallback(() => {
    rootNavigation?.navigate('ModalInfo', { source: 'Home' });
  }, [rootNavigation]);

  const openProfileTab = useCallback(() => {
    tabNavigation?.navigate('ProfileTab', { screen: 'ProfileHome' });
  }, [tabNavigation]);

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

      // Error Tracking (manual trackError API)
      {
        id: 'error-caught',
        title: 'Track Caught Error',
        description: 'Report a caught Error as a component=error span',
        category: TestCategory.ErrorTracking,
        platforms: new Set([MobilePlatform.iOS]),
        onTap: async () => {
          try {
            const cart = {} as { checkout: () => void };
            cart.checkout();
          } catch (e) {
            await SplunkRum.instance.customTracking.trackError(e as Error);
            Alert.alert(
              'Error Tracking',
              'Caught error reported.\nCheck RUM for an error span with exception.type=TypeError and a JS exception.stacktrace.'
            );
          }
        },
      },
      {
        id: 'error-string',
        title: 'Track Error (String)',
        description: 'Report an error from a plain message string',
        category: TestCategory.ErrorTracking,
        platforms: new Set([MobilePlatform.iOS]),
        onTap: async () => {
          await SplunkRum.instance.customTracking.trackError(
            'Manual string error report from example app'
          );
          Alert.alert(
            'Error Tracking',
            'String error reported.\nCheck RUM for an error span with exception.message set and no stacktrace.'
          );
        },
      },
      {
        id: 'error-attributes',
        title: 'Track Error with Attributes',
        description: 'Report a caught error with custom attributes and options',
        category: TestCategory.ErrorTracking,
        platforms: new Set([MobilePlatform.iOS]),
        onTap: async () => {
          try {
            throw new RangeError('Quantity out of range in example app');
          } catch (e) {
            await SplunkRum.instance.customTracking.trackError(e as Error, {
              attributes: {
                'screen.name': 'Home',
                'error.context': 'manual-test',
                'cart.item.count': 3,
              },
              source: ErrorSource.Custom,
              handled: true,
            });
            Alert.alert(
              'Error Tracking',
              'Error with attributes reported.\nCheck RUM for error.source=custom, exception.escaped=false, and the custom screen.name attribute.'
            );
          }
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
        title: 'Fetch GET Request',
        description: 'Network request via JS fetch API',
        category: TestCategory.Network,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          try {
            const response = await fetch(
              'https://jsonplaceholder.typicode.com/posts/1'
            );
            const encoding = response.headers.get('content-encoding') ?? 'none';
            Alert.alert(
              'Fetch GET',
              `Status: ${response.status}\nContent-Encoding: ${encoding}\nCheck span for http.request.method=GET`
            );
          } catch (e: any) {
            Alert.alert('Fetch Error', e?.message ?? String(e));
          }
        },
      },
      {
        id: 'network-gzip',
        title: 'Fetch (gzip response)',
        description:
          'Request gzip-encoded response to verify Content-Encoding capture',
        category: TestCategory.Network,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          try {
            const response = await fetch(
              'https://jsonplaceholder.typicode.com/posts',
              {
                headers: { 'Accept-Encoding': 'gzip' },
              }
            );
            const encoding = response.headers.get('content-encoding') ?? 'none';
            Alert.alert(
              'Gzip Fetch',
              `Status: ${response.status}\nContent-Encoding: ${encoding}\nCheck span for http.response.header.content-encoding`
            );
          } catch (e: any) {
            Alert.alert('Gzip Fetch Error', e?.message ?? String(e));
          }
        },
      },
      {
        id: 'network-post',
        title: 'Fetch POST Request',
        description: 'POST request to verify http.request.method capture',
        category: TestCategory.Network,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          try {
            const response = await fetch(
              'https://jsonplaceholder.typicode.com/posts',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: 'test',
                  body: 'method-capture',
                }),
              }
            );
            Alert.alert(
              'POST Fetch',
              `Status: ${response.status}\nCheck span for http.request.method=POST`
            );
          } catch (e: any) {
            Alert.alert('POST Fetch Error', e?.message ?? String(e));
          }
        },
      },

      // Navigation
      {
        id: 'nav-lab',
        title: 'Open Navigation Lab',
        description: 'Switch to Navigation tab and start scenarios',
        category: TestCategory.Navigation,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          openNavigationLab();
        },
      },
      {
        id: 'nav-detail',
        title: 'Open Detail Screen',
        description: 'Navigate directly to a detail screen with params',
        category: TestCategory.Navigation,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          openNavigationDetail();
        },
      },
      {
        id: 'nav-modal',
        title: 'Open Root Modal',
        description: 'Present a modal from the root stack',
        category: TestCategory.Navigation,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          openRootModal();
        },
      },
      {
        id: 'nav-profile',
        title: 'Switch to Profile Tab',
        description: 'Switch tabs to test focus-based navigation events',
        category: TestCategory.Navigation,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          openProfileTab();
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

      // Endpoint Configuration
      {
        id: 'endpoint-set-realm',
        title: 'Set Endpoint (Realm)',
        description: 'Configure endpoint using realm via preferences',
        category: TestCategory.EndpointConfiguration,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          const endpoint: EndpointConfiguration = {
            realm: appConfig.realm,
            rumAccessToken: appConfig.rumAccessToken,
          };
          await SplunkRum.instance.preferences.setEndpointConfiguration(
            endpoint
          );
          Alert.alert(
            'Endpoint Set',
            `Realm: ${appConfig.realm}\nData will now be sent.`
          );
        },
      },
      {
        id: 'endpoint-set-custom',
        title: 'Set Endpoint (Custom URL)',
        description: 'Configure endpoint using custom trace URL',
        category: TestCategory.EndpointConfiguration,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          await SplunkRum.instance.preferences.setEndpointConfiguration({
            trace: 'https://custom-collector.example.com/v1/traces',
          });
          Alert.alert('Endpoint Set', 'Custom trace URL configured.');
        },
      },
      {
        id: 'endpoint-clear',
        title: 'Clear Endpoint',
        description: 'Clear the endpoint to stop sending data',
        category: TestCategory.EndpointConfiguration,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          await SplunkRum.instance.preferences.setEndpointConfiguration(null);
          Alert.alert('Endpoint Cleared', 'Data will be buffered locally.');
        },
      },
      {
        id: 'endpoint-check-state',
        title: 'Check Endpoint State',
        description: 'Read current endpoint from agent state',
        category: TestCategory.EndpointConfiguration,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          const state = await SplunkRum.instance.getState();
          const ep = state.endpoint;
          if (!ep) {
            Alert.alert('Endpoint State', 'No endpoint configured.');
          } else if ('realm' in ep) {
            Alert.alert(
              'Endpoint State',
              `Realm: ${ep.realm}\nToken: ${ep.rumAccessToken.substring(0, 8)}...`
            );
          } else {
            Alert.alert(
              'Endpoint State',
              `Trace: ${ep.trace}\nReplay: ${ep.sessionReplay ?? 'none'}`
            );
          }
        },
      },

      // Session Replay
      {
        id: 'sr-state',
        title: 'Get Replay State',
        description: 'Display current session replay status and configuration',
        category: TestCategory.SessionReplay,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          const state = await SplunkSessionReplay.instance.getState();
          Alert.alert(
            'Session Replay State',
            `Status: ${state.status}\nRecording: ${state.isRecording}\nSampling: ${state.samplingRate}`
          );
        },
      },
      {
        id: 'sr-start',
        title: 'Start Recording',
        description: 'Start session replay recording',
        category: TestCategory.SessionReplay,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          await SplunkSessionReplay.instance.start();
          const state = await SplunkSessionReplay.instance.getState();
          Alert.alert('Session Replay', `Recording: ${state.isRecording}`);
        },
      },
      {
        id: 'sr-stop',
        title: 'Stop Recording',
        description: 'Stop session replay recording',
        category: TestCategory.SessionReplay,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          await SplunkSessionReplay.instance.stop();
          const state = await SplunkSessionReplay.instance.getState();
          Alert.alert('Session Replay', `Status: ${state.status}`);
        },
      },
      {
        id: 'sr-mask-set',
        title: 'Set Recording Mask',
        description:
          'Mask a 200x100 area at (50, 200) with a 60x40 erasing hole',
        category: TestCategory.SessionReplay,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          await SplunkSessionReplay.instance.setRecordingMask({
            elements: [
              {
                rect: { x: 50, y: 200, width: 200, height: 100 },
                type: MaskType.COVERING,
              },
              {
                rect: { x: 80, y: 220, width: 60, height: 40 },
                type: MaskType.ERASING,
              },
            ],
          });
          Alert.alert('Recording Mask', 'Mask set (covering + erasing hole)');
        },
      },
      {
        id: 'sr-mask-get',
        title: 'Get Recording Mask',
        description: 'Display current recording mask elements',
        category: TestCategory.SessionReplay,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          const mask = await SplunkSessionReplay.instance.getRecordingMask();
          if (!mask) {
            Alert.alert('Recording Mask', 'No mask set');
          } else {
            const desc = mask.elements
              .map(
                (e) =>
                  `${e.type}: (${e.rect.x}, ${e.rect.y}) ${e.rect.width}x${e.rect.height}`
              )
              .join('\n');
            Alert.alert(
              'Recording Mask',
              `${mask.elements.length} element(s):\n${desc}`
            );
          }
        },
      },
      {
        id: 'sr-mask-clear',
        title: 'Clear Recording Mask',
        description: 'Remove the recording mask',
        category: TestCategory.SessionReplay,
        platforms: new Set([MobilePlatform.Android, MobilePlatform.iOS]),
        onTap: async () => {
          await SplunkSessionReplay.instance.setRecordingMask(null);
          Alert.alert('Recording Mask', 'Mask cleared');
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
    [
      openNavigationDetail,
      openNavigationLab,
      openProfileTab,
      openRootModal,
      setShowReport,
      setTestReport,
    ]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔭 Splunk OTel RN Test App</Text>
        <Text style={styles.subtitle}>
          {installed ? '✓ SDK Installed' : '⏳ Initializing...'}
        </Text>
      </View>
      <StatusBar />
      <SessionIdBar />
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
                  <Text style={styles.summaryNumber}>{testReport.passed}</Text>
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
                      result.passed ? styles.resultPassed : styles.resultFailed,
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
  );
};

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
