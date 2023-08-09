import { argv } from 'yargs';
import { config as wdioConfig } from './wdio.sauce.shared';

// =============
// Exclude specs
// =============
wdioConfig.exclude = [
	// The app needs to be on the home screen and that doesn't work equal
	// for all different Android devices / OS versions
	'./tests/e2e/spec/extra/force.touch.spec.js',
];

// ============
// Capabilities
// ============
// For all capabilities please check
// http://appium.io/docs/en/writing-running-appium/caps/#general-capabilities
wdioConfig.capabilities = [
	{
        'platformName': 'Android',
        'appium:app': 'storage:6542e795-3a5b-457a-a5de-3d488892e851',
        'appium:deviceName': 'Google Pixel 5 GoogleAPI Emulator',
        'appium:platformVersion': '12.0',
        'appium:automationName': 'UiAutomator2',
        'sauce:options': {
          appiumVersion: '2.0.0-beta56',
          tunnelIdentifier: 'sso-splunk.saucelabs.com-mhennoch_tunnel_name',
          extendedDebugging: true,
        }
	},
];
wdioConfig.maxInstances = 25;

export { wdioConfig as config };
