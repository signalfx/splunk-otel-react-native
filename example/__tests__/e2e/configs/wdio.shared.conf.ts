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

export interface MobileConfig extends WebdriverIO.Config {
  firstAppStart: boolean;
}

export const config: MobileConfig = {
  // ==================
  // Specify Test Files
  // ==================
  //
  // specs: ['./__tests__/e2e/specs/*.spec.ts'],
  specs: ['../specs/*.spec.ts'],
  // ============
  // Capabilities
  // ============
  //
  capabilities: [],

  // ===================
  // Test Configurations
  // ===================
  //
  logLevel: 'silent',
  bail: 0,
  baseUrl: 'http://localhost',
  waitforTimeout: 15000,
  // A timeout of 5 min
  connectionRetryTimeout: 5 * 60 * 1000,
  connectionRetryCount: 2,
  services: [],
  // Framework you want to run your specs with.
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    // Add a 5 min timeout per test
    timeout: 5 * 60 * 1000,
  },

  // =====
  // Session flags
  // =====
  //
  /**
   * Custom property that is used to determine if the app is already launched for the first time
   * This property is needed because the first time the app is automatically started, so a double
   * restart is not needed.
   */
  firstAppStart: true,

  // =====
  // Hooks
  // =====
  //
};
