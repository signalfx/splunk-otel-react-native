import {
  addJavaScriptArtifactContext,
  snapshotRuntimeSourceMapIds,
} from '../instrumentation/JavaScriptSourceMapRegistry';

describe('JavaScriptSourceMapRegistry', () => {
  afterEach(() => {
    delete (globalThis as typeof globalThis & {
      __splunkRumSourceMapRegistrations?: unknown;
    }).__splunkRumSourceMapRegistrations;
    delete (globalThis as typeof globalThis & { HermesInternal?: unknown })
      .HermesInternal;
  });

  it('builds a deterministic selector map and attaches JavaScript artifact context', () => {
    (globalThis as typeof globalThis & {
      __splunkRumSourceMapRegistrations?: unknown;
    }).__splunkRumSourceMapRegistrations = {
      'Error\n at global (address at features/payments.android.bundle:1:7)':
        '22222222-2222-4222-8222-222222222222',
      'Error\n at global (address at index.android.bundle:1:42)':
        '11111111-1111-4111-8111-111111111111',
    };

    expect(snapshotRuntimeSourceMapIds()).toEqual({
      'features/payments.android.bundle': '22222222-2222-4222-8222-222222222222',
      'index.android.bundle': '11111111-1111-4111-8111-111111111111',
    });
    expect(addJavaScriptArtifactContext({ custom: 'value' })).toEqual({
      custom: 'value',
      'splunk.rum.platform': 'react-native',
      'splunk.rum.js.bundle.origin': 'embedded',
      'splunk.rum.js.engine': 'jsc',
      'error.sourceMapIds': JSON.stringify(snapshotRuntimeSourceMapIds()),
    });
  });

  it('derives the selector from an absolute iOS registration stack', () => {
    (globalThis as typeof globalThis & {
      __splunkRumSourceMapRegistrations?: unknown;
    }).__splunkRumSourceMapRegistrations = {
      'Error\n at global (/private/app/MyApp.app/main.jsbundle:1:42)':
        '11111111-1111-4111-8111-111111111111',
    };

    expect(snapshotRuntimeSourceMapIds()).toEqual({
      'main.jsbundle': '11111111-1111-4111-8111-111111111111',
    });
  });

  it('marks Hermes when HermesInternal is available', () => {
    (globalThis as typeof globalThis & { HermesInternal?: unknown }).HermesInternal = {};
    expect(addJavaScriptArtifactContext({})['splunk.rum.js.engine']).toBe('hermes');
    delete (globalThis as typeof globalThis & { HermesInternal?: unknown }).HermesInternal;
  });

  it('omits ambiguous selectors instead of guessing', () => {
    (globalThis as typeof globalThis & {
      __splunkRumSourceMapRegistrations?: unknown;
    }).__splunkRumSourceMapRegistrations = {
      'Error\n at first (address at index.android.bundle:1:1)':
        '11111111-1111-4111-8111-111111111111',
      'Error\n at second (address at index.android.bundle:1:2)':
        '22222222-2222-4222-8222-222222222222',
    };

    expect(snapshotRuntimeSourceMapIds()).toEqual({});
  });
});
