import SplunkOtelReactNative from './NativeSplunkOtelReactNative';

export async function multiply(a: number, b: number): Promise<number> {
  const result = await SplunkOtelReactNative.multiply(a, b);
  return result + 16;
}
