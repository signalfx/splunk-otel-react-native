import { SplunkRum } from '@splunk/otel-react-native';

export interface AssertionResult {
  passed: boolean;
  testName: string;
  message: string;
  error?: string;
}

export interface ApiTestReport {
  passed: number;
  failed: number;
  results: AssertionResult[];
  duration: number;
}

class Assertions {
  private results: AssertionResult[] = [];

  assert(condition: boolean, testName: string, message: string): void {
    this.results.push({
      passed: condition,
      testName,
      message: condition ? '✓ ' + message : '✗ ' + message,
      error: condition ? undefined : `Assertion failed: ${message}`,
    });
  }

  assertNotEmpty(
    value: string | null | undefined,
    testName: string,
    what: string
  ): void {
    const passed = value !== null && value !== undefined && value.length > 0;
    this.assert(
      passed,
      testName,
      `${what} should not be empty (got: "${value ?? 'null'}")`
    );
  }

  assertEqual<T>(actual: T, expected: T, testName: string, what: string): void {
    const passed = actual === expected;
    this.assert(
      passed,
      testName,
      `${what} should equal ${expected} (got: ${actual})`
    );
  }

  assertInRange(
    value: number,
    min: number,
    max: number,
    testName: string,
    what: string
  ): void {
    const passed = value >= min && value <= max;
    this.assert(
      passed,
      testName,
      `${what} should be in [${min}, ${max}] (got: ${value})`
    );
  }

  getResults(): AssertionResult[] {
    return [...this.results];
  }

  clear(): void {
    this.results = [];
  }
}

export async function runApiAssertionTests(): Promise<ApiTestReport> {
  const startTime = Date.now();
  const assertions = new Assertions();
  const sdk = SplunkRum.instance;

  try {
    console.log('[API Test] Testing State...');
    const state = await sdk.getState();

    assertions.assertNotEmpty(state.appName, 'State', 'appName');
    assertions.assertNotEmpty(
      state.deploymentEnvironment,
      'State',
      'deploymentEnvironment'
    );
    assertions.assert(
      state.status.type !== 'NotRunning' ||
        state.status.reason !== 'NotInstalled',
      'State',
      'Agent should be installed'
    );

    console.log('[API Test] Testing Session State...');
    const sessionState = await sdk.session.state();

    assertions.assertNotEmpty(sessionState.id, 'Session', 'sessionId');
    assertions.assertInRange(
      sessionState.samplingRate,
      0,
      1,
      'Session',
      'samplingRate'
    );

    console.log('[API Test] Testing User State...');
    const userState = await sdk.user.state();

    assertions.assert(
      userState.trackingMode === 'NO_TRACKING' ||
        userState.trackingMode === 'ANONYMOUS_TRACKING',
      'User',
      `trackingMode should be valid (got: ${userState.trackingMode})`
    );

    // Test setting user tracking mode
    await sdk.user.preferences.setTrackingMode('NO_TRACKING');
    const userStateAfter = await sdk.user.state();
    assertions.assertEqual(
      userStateAfter.trackingMode,
      'NO_TRACKING',
      'User',
      'trackingMode after set'
    );

    console.log('[API Test] Testing Global Attributes...');
    const ga = sdk.globalAttributes;

    // Clean slate
    await ga.removeAll();
    let allAttrs = await ga.getAll();
    assertions.assertEqual(
      Object.keys(allAttrs).length,
      0,
      'GlobalAttrs',
      'should be empty after removeAll()'
    );

    // String
    await ga.setString('ga_string', 'hello');
    const gaString = await ga.getString('ga_string');
    assertions.assertEqual(
      gaString,
      'hello',
      'GlobalAttrs',
      'ga_string roundtrip'
    );

    // Number
    await ga.setNumber('ga_number', 42);
    const gaNumber = await ga.getNumber('ga_number');
    assertions.assertEqual(gaNumber, 42, 'GlobalAttrs', 'ga_number roundtrip');

    // Boolean
    await ga.setBoolean('ga_bool', true);
    const gaBool = await ga.getBoolean('ga_bool');
    assertions.assertEqual(gaBool, true, 'GlobalAttrs', 'ga_bool roundtrip');

    // Array
    await ga.setArray('ga_array', ['a', 'b', 'c']);
    const gaArray = await ga.getArray('ga_array');
    assertions.assert(
      Array.isArray(gaArray) && gaArray.length === 3,
      'GlobalAttrs',
      `ga_array should have 3 elements (got: ${JSON.stringify(gaArray)})`
    );

    // contains()
    const hasGaString = await ga.contains('ga_string');
    assertions.assertEqual(
      hasGaString,
      true,
      'GlobalAttrs',
      'contains(ga_string)'
    );

    // getAll()
    allAttrs = await ga.getAll();
    assertions.assert(
      Object.keys(allAttrs).length >= 4,
      'GlobalAttrs',
      `getAll() should return at least 4 attrs (got: ${Object.keys(allAttrs).length})`
    );

    // setAll() bundle
    await ga.setAll({
      bundle_string: 'pack',
      bundle_number: 7,
      bundle_bool: false,
    });
    const bundleString = await ga.getString('bundle_string');
    assertions.assertEqual(
      bundleString,
      'pack',
      'GlobalAttrs',
      'bundle_string after setAll()'
    );

    // remove()
    await ga.remove('ga_string');
    const hasAfterRemove = await ga.contains('ga_string');
    assertions.assertEqual(
      hasAfterRemove,
      false,
      'GlobalAttrs',
      'ga_string should be removed'
    );

    // size() and keys()
    const size = await ga.size();
    const keys = await ga.keys();
    assertions.assertEqual(
      size,
      keys.length,
      'GlobalAttrs',
      'size() should match keys().length'
    );

    // Final cleanup
    await ga.removeAll();
    const finalSize = await ga.size();
    assertions.assertEqual(
      finalSize,
      0,
      'GlobalAttrs',
      'size should be 0 after removeAll()'
    );

    console.log('[API Test] Testing Custom Tracking...');

    // Track event - should not throw
    try {
      await sdk.customTracking.trackCustomEvent('test_api_event', {
        'test.key': 'test_value',
        'test.number': 123,
      });
      assertions.assert(true, 'CustomTracking', 'trackCustomEvent() completed');
    } catch (e: any) {
      assertions.assert(
        false,
        'CustomTracking',
        `trackCustomEvent() failed: ${e.message}`
      );
    }

    // Workflow
    try {
      const handle =
        await sdk.customTracking.startWorkflow('test_api_workflow');
      assertions.assert(
        handle !== null,
        'CustomTracking',
        'startWorkflow() returned handle'
      );
      await handle.end();
      assertions.assert(true, 'CustomTracking', 'workflow.end() completed');
    } catch (e: any) {
      assertions.assert(
        false,
        'CustomTracking',
        `workflow failed: ${e.message}`
      );
    }
  } catch (e: any) {
    assertions.assert(false, 'General', `Unexpected error: ${e.message}`);
  }

  const results = assertions.getResults();
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`\n✅ API Tests Complete: ${passed} passed, ${failed} failed`);
  results.forEach((r) => {
    console.log(`  ${r.passed ? '✓' : '✗'} [${r.testName}] ${r.message}`);
  });

  return {
    passed,
    failed,
    results,
    duration: Date.now() - startTime,
  };
}
