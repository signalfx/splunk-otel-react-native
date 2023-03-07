/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { SplunkRum } from '@splunk/otel-react-native';

export const Rum = SplunkRum.init({
  beaconEndpoint: 'https://localhost:53820/zipkindump',
  applicationName: 'reactNativeTest',
  rumAccessToken: 'test',
  debug: true,
});

AppRegistry.registerComponent(appName, () => App);
