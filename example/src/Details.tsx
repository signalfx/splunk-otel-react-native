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

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function Details() {
  const [customUrl, setCustomUrl] = useState(
    'http://pmrum3.o11ystore.com/product/OLJCESPC7Z'
  );

  const rnFetch = async () => {
    try {
      const url = 'http://pmrum3.o11ystore.com/';
      await fetch(url);
    } catch (error) {
      console.error(error);
    }
  };
  const customFetch = async () => {
    try {
      console.log('custom fetch with: ', customUrl);
      if (customUrl) {
        await fetch(customUrl);
      }
    } catch (error) {
      console.error(error);
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
      <TextInput
        style={styles.input}
        onChangeText={setCustomUrl}
        value={customUrl}
      />
      <Button title="Fetch custom" onPress={customFetch} />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});
