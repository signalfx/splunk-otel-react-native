import { NativeModules, Platform } from 'react-native';

interface NativeTestModuleType {
  simulateCrash(): Promise<void>;
  simulateANR(): Promise<void>;
  simulateSlowRender(): Promise<void>;
  simulateFrozenRender(): Promise<void>;
  testOkHttpGet(url?: string): Promise<string>;
  testHttpUrlConnectionGet(url?: string): Promise<string>;
  testURLSessionGet(url?: string): Promise<string>;
}

const NativeTestModule: NativeTestModuleType | null =
  NativeModules.SplunkTestModule ?? null;

class TestBridge {
  private get native(): NativeTestModuleType {
    if (!NativeTestModule) {
      throw new Error('SplunkTestModule native module is not linked.');
    }
    return NativeTestModule;
  }

  get isAvailable(): boolean {
    return NativeTestModule !== null;
  }

  async simulateCrash(): Promise<void> {
    return this.native.simulateCrash();
  }

  async simulateANR(): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new Error('ANR simulation is only available on Android');
    }
    return this.native.simulateANR();
  }

  async simulateSlowRender(): Promise<void> {
    return this.native.simulateSlowRender();
  }

  async simulateFrozenRender(): Promise<void> {
    return this.native.simulateFrozenRender();
  }

  async testOkHttpGet(url?: string): Promise<string> {
    if (Platform.OS !== 'android') {
      throw new Error('OkHttp is only available on Android');
    }
    return this.native.testOkHttpGet(url);
  }

  async testHttpUrlConnectionGet(url?: string): Promise<string> {
    if (Platform.OS !== 'android') {
      throw new Error('HttpURLConnection is only available on Android');
    }
    return this.native.testHttpUrlConnectionGet(url);
  }

  async testURLSessionGet(url?: string): Promise<string> {
    if (Platform.OS !== 'ios') {
      throw new Error('URLSession is only available on iOS');
    }
    return this.native.testURLSessionGet(url);
  }
}

export const NativeTestBridge = new TestBridge();
