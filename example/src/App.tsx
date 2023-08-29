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
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './Home';
import Details from './Details';
import {
  OtelWrapper,
  startNavigationTracking,
} from '@splunk/otel-react-native';
import type { ReactNativeConfiguration } from '@splunk/otel-react-native';
import Config from 'react-native-config';

const RumConfig: ReactNativeConfiguration = {
  // realm: 'us0',
  beaconEndpoint: Config.BEACON_ENDPOINT,
  applicationName: 'ReactNativeExampleTest3',
  rumAccessToken: '',
  debug: true,
  globalAttributes: {
    globalAttr1: '42',
    globalAttr2: 42,
  },
  ignoreUrls: ['http://pmrum3.o11ystore.com/product/OLJCESPC7Z'],
};

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useNavigationContainerRef();
  return (
    <OtelWrapper configuration={RumConfig}>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          startNavigationTracking(navigationRef);
        }}
      >
        <Stack.Navigator>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Details" component={Details} />
        </Stack.Navigator>
      </NavigationContainer>
    </OtelWrapper>
  );
}
