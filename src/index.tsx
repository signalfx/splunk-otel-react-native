import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'splunk-otel-react-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const SplunkOtelReactNative = NativeModules.SplunkOtelReactNative
  ? NativeModules.SplunkOtelReactNative
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export interface ReactNativeConfiguration {
  realm?: string;
  beaconEndpoint: string;
  rumAccessToken: string;
  applicationName: string;
  environment?: string;
}

export interface NativeSdKConfiguration {
  beaconEndpoint?: string;
  rumAccessToken?: string;
}
//TODO should probably not export this
export function initializeNativeSdk(
  config: NativeSdKConfiguration
): Promise<string> {
  return SplunkOtelReactNative.initialize(config);
}

export function exportSpanToNative(span: object): Promise<null> {
  return SplunkOtelReactNative.export(span);
}

// TODO tmp? workaround for otel which uses timeOrigin
if (!global.performance.timeOrigin) {
  (global as any).performance.timeOrigin = Date.now() - performance.now();
  console.log(
    'Setting new timeorigin',
    global.performance.timeOrigin,
    new Date(global.performance.timeOrigin)
  );
}

console.log('DATE NOW: ', Date.now(), new Date());
console.log('PERF NOW: ', performance.now());

export * from './splunkRum';
export * from './trackNavigation';
