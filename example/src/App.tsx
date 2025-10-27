import { Text, View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { multiply } from '@splunk/otel-react-native';

export default function App() {
  const [result, setResult] = useState<string>('pending...');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const value = await multiply(3, 7);
        if (mounted) setResult(String(value));
      } catch (e: any) {
        if (mounted) setResult(`error: ${e?.message ?? String(e)}`);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>Result: {result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
