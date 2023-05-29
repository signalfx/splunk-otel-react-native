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

import { config } from './wdio.shared.conf';

// ====================
// Runner Configuration
// ====================
//
config.port = 4723;

// ===================
// Test Configurations
// ===================
//
config.services = (config.services || []).concat([
  [
    'appium',
    {
      command: 'appium',
    },
  ],
]);

// Never run the RDC tests
config.exclude = ['./__tests__/e2e/specs/*.rdc.spec.ts'];

export default config;
