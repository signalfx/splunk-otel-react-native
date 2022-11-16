import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import { trace, context } from '@opentelemetry/api';

export default function Home({ navigation }) {
  const [data, setData] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const tracer = trace.getTracer('home');

  useEffect(() => {
    // setTimeout(() => {
    //   console.log('APP:useEffect');
    //   SplunkRum.finishAppStart();
    // }, 2431);
  }, []);

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
    // setLoading(true);
    try {
      const url = 'http://pmrum3.o11ystore.com/product/L9ECAV7KIM';
      await fetch(url);
    } catch (error) {
      console.error(error);
    } finally {
      // setLoading(false);
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
        onPress={() => navigation.navigate('Details')}
      />
      <Button title="Nested fetch custom span" onPress={createSpan} />
      <Button title="RN fetch GET" onPress={rnFetch} />
      <Button title="Workflow span" onPress={workflowSpan} />
      <Text>{isLoading && 'Loading'}</Text>
      <Button title="JS error" onPress={throwError} />
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
