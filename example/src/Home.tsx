/*
Copyright 2022 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from 'react';
import { StyleSheet, View, Button } from 'react-native';
import { trace, context } from '@opentelemetry/api';
import { SplunkRum } from '@splunk/otel-react-native';

export default function Home({ navigation }: { navigation: any }) {
  const tracer = trace.getTracer('home');

  const createSpan = () => {
    const parent = tracer.startSpan('clickToFetch');
    parent.setAttributes({
      component: 'user-interaction',
      event_type: 'click',
      label: 'Make custom span',
    });
    const ctx = trace.setSpan(context.active(), parent);

    context.with(ctx, async () => {
      await rnFetch();
    });

    parent.end();
  };

  const rnFetch = async () => {
    try {
      const url = 'https://raw.githubusercontent.com/signalfx/splunk-otel-react-native/main/package.json';
      await fetch(url);
    } catch (error) {
      console.error(error);
    }
  };
  const throwError = () => {
    console.log('CLIENT:throwError');
    throw new Error('my nice custom error');
  };

  const workflowSpan = () => {
    const now = Date.now();
    const span = tracer.startSpan('click', { startTime: now });
    span.setAttributes({
      'component': 'user-interaction',
      'workflow.name': 'CUSTOM_SPAN_1',
    });
    span.end(now + 5000);
  };

  return (
    <View style={styles.container}>
      <Button
        title="Go to Details Screen"
        accessibilityLabel="goToDetailScreen"
        testID="goToDetailScreen"
        onPress={() => navigation.navigate('Details')}
      />
      <Button title="Nested fetch custom span" onPress={createSpan} />
      <Button
        title="RN fetch GET"
        onPress={rnFetch}
        accessibilityLabel="fetch"
        testID="fetch"
      />
      <Button title="Workflow span" onPress={workflowSpan} />
      <Button
        title="New session"
        onPress={SplunkRum._generatenewSessionId}
        accessibilityLabel="newSession"
        testID="newSession"
      />
      <Button
        accessibilityLabel="crash"
        testID="crash"
        title="Crash"
        onPress={SplunkRum._testNativeCrash}
      />
      <Button
        title="JS error"
        onPress={throwError}
        testID="jsError"
        accessibilityLabel="jsError"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
