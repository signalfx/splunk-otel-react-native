import SplunkOtelReactNative from './NativeSplunkOtelReactNative';

export function multiply(a: number, b: number): number {
  return SplunkOtelReactNative.multiply(a, b) + 16;
}
