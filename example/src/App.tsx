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
  SplunkRum,
  startNavigationTracking,
} from '@splunk/otel-react-native';
import type { ReactNativeConfiguration } from '@splunk/otel-react-native';
import Config from 'react-native-config';
import Geolocation from '@react-native-community/geolocation';

Geolocation.getCurrentPosition((info) => {
  console.log(info);
  SplunkRum.updateLocation(info.coords.latitude, info.coords.longitude);
});

const RumConfig: ReactNativeConfiguration = {
  //TODO fix config setting for iOS in inegration tests
  //beaconEndpoint: Config.BEACON_ENDPOINT || 'http://localhost:53820/zipkindump',
  realm: 'eu0',
  applicationName: 'RnExampleAndroidWithLocation',
  allowInsecureBeacon: true,
  rumAccessToken: 'iSb9fND7j5yjW5cGIH2J-g',
  debug: true,
  globalAttributes: {
    'app.version': '1.1.5',
    'globalAttr1': '42',
    'globalAttr2': 42,
  },
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
