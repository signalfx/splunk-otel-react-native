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
  user: process.env.SAUCE_USERNAME,
  key: process.env.SAUCE_ACCESS_KEY,
  region: 'us',
  // We can't start more than one devServer and not sure how to differentiate between tests spans
  // if we have only one server.
  maxInstances: 1,
  services: ['sauce'],
  capabilities: [
    {
      'platformName': 'iOS',
      // 'appium:deviceName': 'iPhone Simulator',
      // 'appium:platformVersion': '17.0',
      'appium:platformVersion': 'current_major',
      'appium:deviceName': 'iPhone Instant Simulator',
      'appium:automationName': 'XCUITest',
      'appium:app': 'storage:196a8f14-e012-4d7f-94ba-7be15716462f',
      'sauce:options': {
        tunnelIdentifier: process.env.SAUCE_TUNNEL_ID,
      },
    },
  ],
};
