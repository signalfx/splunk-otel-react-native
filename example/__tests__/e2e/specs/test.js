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

const { remote } = require('webdriverio');
const { join } = require('path');

const localCapabilities = {
  'platformName': 'Android',
  'appium:automationName': 'UiAutomator2',
  // 'appium:deviceName': 'emulator-5554',
  'appium:platformVersion': '12.0',
  'appium.app': 'storage:0fff4b7-390e-495e-98a4-f2eef1d41cef',
  // 'appium:app': join(
  //   __dirname,
  //   '../../../',
  //   `./android/app/build/outputs/apk/release/app-release.apk`
  // ),
  'appium:appWaitActivity': 'com.splunkotelreactnativeexample.MainActivity',
};

const sauceLabsCapabilities = {
  'platformName': 'Android',
  // 'appium:app': 'storage:90fff4b7-390e-495e-98a4-f2eef1d41cef',
  'appium:app': 'storage:9ebe6c99-079a-472a-96b1-a688c19f0540',
  'appium:deviceName': 'Google Pixel 5 GoogleAPI Emulator',
  'appium:deviceOrientation': 'portrait',
  'appium:platformVersion': '12.0',
  // 'appium:tunnelIdentifier': 'e982920442c6402b9d84d418c7d39afd',
  'appium:automationName': 'UiAutomator2',
  'sauce:options': {
    appiumVersion: '2.0.0-beta56',
    tunnelName: 'sso-splunk.saucelabs.com-mhennoch_tunnel_name',
    extendedDebugging: true,
    // build: '<your build id>',
    // name: '<your test name>',
  },
};

const wdOpts = {
  // host: process.env.APPIUM_HOST || 'localhost',
  user: 'sso-splunk.saucelabs.com-mhennoch',
  key: process.env.SAUCE_ACCESS_KEY,
  hostname: 'ondemand.us-west-1.saucelabs.com',
  port: 443,
  baseUrl: 'wd/hub',
  // services: [
  //   'appium',
  //   {
  //     command: 'appium',
  //   },
  // ],
  // port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
  // logLevel: 'info',
  capabilities: sauceLabsCapabilities,
};

console.log('wdOpts', wdOpts);

async function runTest() {
  const driver = await remote(wdOpts);
  try {
    const button = await driver.$('~crashButton');
    await button.waitForExist({ timeout: 2000 });
  } finally {
    await driver.pause(3000);
    await driver.deleteSession();
  }
}

runTest().catch(console.error);
