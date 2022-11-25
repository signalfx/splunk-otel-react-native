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
