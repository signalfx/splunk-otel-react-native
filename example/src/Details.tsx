import React from 'react';
import { View, Text, Button } from 'react-native';

export default function Details() {
  const rnFetch = async () => {
    try {
      const url = 'http://pmrum3.o11ystore.com/';
      await fetch(url);
    } catch (error) {
      console.error(error);
    } finally {
      // yo
    }
  };

  const throwError = () => {
    throw new TypeError('custom typeError');
  };

  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Details Screen</Text>
      <Button title="RN fetch GET" onPress={rnFetch} />
      <Button title="JS error" onPress={throwError} />
    </View>
  );
}
