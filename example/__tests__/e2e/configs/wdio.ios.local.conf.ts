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

import type { Options } from '@wdio/types';
import { config as baseConfig } from './wdio.conf';

export const config: Options.Testrunner = {
  ...baseConfig,
  maxInstances: 1, // unless you have more emulators
  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: parseInt(process.env.APPIUM_PORT || '4723', 10),
  capabilities: [
    {
      'platformName': 'iOS',
      'appium:deviceName': 'iPhone 15 Pro',
      'appium:platformVersion': '17.0',
      'appium:automationName': 'XCUITest',
      //TODO find local app file
      'appium:app': 'SplunkOtelReactNativeExample.app'
    },
  ],
};
