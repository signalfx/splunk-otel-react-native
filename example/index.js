import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import { SplunkRum } from 'splunk-otel-react-native';

export const Rum = SplunkRum.init({
  beaconEndpoint: 'http://192.168.1.96:53820/zipkindump',
  // beaconEndpoint: 'http://192.168.1.136:9412/api/v2/spans',
  // beaconEndpoint: 'https://rum-ingest.us0.signalfx.com/v1/rum',
  applicationName: 'reactNativeTest',
  rumAccessToken: 'test',
});

AppRegistry.registerComponent(appName, () => App);
