import {
  TurboModuleRegistry,
  NativeModules,
  type TurboModule,
} from 'react-native';

export interface Spec extends TurboModule {
  multiply(a: number, b: number): Promise<number>;
}

const Turbo = TurboModuleRegistry.get<Spec>('SplunkOtelReactNative');
const Legacy = (NativeModules as any).SplunkOtelReactNative as Spec | undefined;

if (!Turbo && !Legacy) {
  throw new Error('Native module SplunkOtelReactNative is not linked.');
}

export default (Turbo ?? Legacy)!;
