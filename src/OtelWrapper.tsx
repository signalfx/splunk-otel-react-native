/*
Copyright 2023 Splunk Inc.

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

import React, { useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import type { ReactNativeConfiguration } from './splunkRum';
import { SplunkRum } from './splunkRum';
import { GestureResponderEvent, View } from 'react-native';

type Props = PropsWithChildren<{
  configuration: ReactNativeConfiguration;
}>;

let isInitialized = false;
// Views won't render if they don't have any content or styling
const wrapperStyle = { flex: 1 };

const TouchBoundary: React.FC = ({ children }) => {
  const _onTouchStart = (event: GestureResponderEvent) => {
    // console.log('TouchBoundary onTouchStart', event);
    const names = getComponentTreeNames(event);
    console.log('names', names);
  };

  function getComponentTreeNames(e) {
    let currentInst = e._targetInst;
    const componentTreeNames = [];

    while (currentInst) {
      const name =
        currentInst.elementType?.displayName || currentInst.elementType?.name;

      if (name) {
        componentTreeNames.unshift(name);
      }

      currentInst = currentInst.return;
    }

    return componentTreeNames;
  }

  return (
    <View style={wrapperStyle} onTouchStart={_onTouchStart}>
      {children}
    </View>
  );
};

export const OtelWrapper: React.FC<Props> = ({ children, configuration }) => {
  useEffect(() => {
    SplunkRum.finishAppStart();
  }, []);

  if (!isInitialized) {
    SplunkRum.init(configuration);
    isInitialized = true;
  } else {
    console.log('Already initialized');
  }
  console.log('OtelWrapper', configuration);
  if (configuration.interactionsEnabled) {
    console.log('interactionsEnabled');
    return <TouchBoundary>{children}</TouchBoundary>;
  }

  return <>{children}</>;
};
