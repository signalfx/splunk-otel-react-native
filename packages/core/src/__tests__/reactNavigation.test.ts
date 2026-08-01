/*
 * Copyright 2026 Splunk Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { SplunkRum } from '../api/SplunkRum';
import NativeModule from '../specs/NativeSplunkOtelReactNative';
import { reactNavigationIntegration } from '../integrations/reactNavigation';

type FakeRoute = { name: string; key?: string; params?: object };

/**
 * Minimal fake of a react-navigation container ref for the integration.
 * Models per-event listeners (`state` / `ready`) and `isReady()`, matching the
 * structural surface the integration relies on.
 */
function fakeContainer(initialRoute?: FakeRoute, opts?: { ready?: boolean }) {
  let current = initialRoute;
  let ready = opts?.ready ?? true;
  const listeners: Record<string, (() => void) | undefined> = {};

  return {
    getCurrentRoute: () => current,
    isReady: () => ready,
    addListener: (type: 'state' | 'ready', cb: () => void) => {
      listeners[type] = cb;
      return () => {
        listeners[type] = undefined;
      };
    },
    // test helpers
    _set: (route?: FakeRoute) => {
      current = route;
    },
    _emit: () => listeners.state?.(),
    _emitReady: () => {
      ready = true;
      listeners.ready?.();
    },
    _hasListener: () => listeners.state !== undefined,
    _hasReadyListener: () => listeners.ready !== undefined,
  };
}

describe('reactNavigationIntegration', () => {
  let trackSpy: jest.SpyInstance;

  beforeEach(() => {
    trackSpy = jest
      .spyOn(SplunkRum.instance.navigation, 'track')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    trackSpy.mockRestore();
  });

  it('tracks the initial route on register', () => {
    const c = fakeContainer({ name: 'Home', key: 'Home-1' });

    reactNavigationIntegration().registerNavigationContainer(c);

    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy).toHaveBeenCalledWith('Home', undefined);
  });

  it('does not track the initial route when trackInitialRoute is false', () => {
    const c = fakeContainer({ name: 'Home', key: 'Home-1' });

    reactNavigationIntegration({ trackInitialRoute: false }).registerNavigationContainer(
      c
    );

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('seeds dedup so a stray same-screen event is not recorded when trackInitialRoute is false', () => {
    const c = fakeContainer({ name: 'Splash', key: 'Splash-1' });

    reactNavigationIntegration({ trackInitialRoute: false }).registerNavigationContainer(
      c
    );
    expect(trackSpy).not.toHaveBeenCalled();

    // A stray state event on the SAME screen (e.g. setOptions) must not leak it.
    c._emit();
    expect(trackSpy).not.toHaveBeenCalled();

    // A real navigation to a different screen is still recorded.
    c._set({ name: 'Home', key: 'Home-1' });
    c._emit();
    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy).toHaveBeenCalledWith('Home', undefined);
  });

  it('defers the initial route to the ready event when not ready at register time', () => {
    const c = fakeContainer({ name: 'Home', key: 'Home-1' }, { ready: false });

    reactNavigationIntegration().registerNavigationContainer(c);

    // Not ready yet: nothing tracked, but a ready listener is registered.
    expect(trackSpy).not.toHaveBeenCalled();
    expect(c._hasReadyListener()).toBe(true);

    c._emitReady();
    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy).toHaveBeenCalledWith('Home', undefined);
  });

  it('seeds dedup via the ready event when not ready and trackInitialRoute is false', () => {
    const c = fakeContainer({ name: 'Splash', key: 'Splash-1' }, { ready: false });

    reactNavigationIntegration({ trackInitialRoute: false }).registerNavigationContainer(
      c
    );

    // We still subscribe to 'ready' so the dedup key can be seeded.
    expect(c._hasReadyListener()).toBe(true);

    c._emitReady();
    expect(trackSpy).not.toHaveBeenCalled();

    // Stray same-screen event -> deduped; navigating away -> recorded.
    c._emit();
    expect(trackSpy).not.toHaveBeenCalled();

    c._set({ name: 'Home', key: 'Home-1' });
    c._emit();
    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy).toHaveBeenCalledWith('Home', undefined);
  });

  it('tracks on route change and dedups the same focused route', () => {
    const c = fakeContainer({ name: 'Home', key: 'Home-1' });
    reactNavigationIntegration().registerNavigationContainer(c);
    trackSpy.mockClear();

    c._set({ name: 'Detail', key: 'Detail-1' });
    c._emit();
    expect(trackSpy).toHaveBeenCalledWith('Detail', undefined);

    // Same key again -> deduped.
    c._emit();
    expect(trackSpy).toHaveBeenCalledTimes(1);
  });

  it('does not dedup when the route key changes', () => {
    const c = fakeContainer({ name: 'Home', key: 'Home-1' });
    reactNavigationIntegration().registerNavigationContainer(c);
    trackSpy.mockClear();

    c._set({ name: 'Detail', key: 'Detail-1' });
    c._emit();
    c._set({ name: 'Detail', key: 'Detail-2' });
    c._emit();

    expect(trackSpy).toHaveBeenCalledTimes(2);
  });

  it('renames a view via viewNamePredicate', () => {
    const c = fakeContainer({ name: 'Home', key: 'k' });

    reactNavigationIntegration({
      viewNamePredicate: (_route, defaultName) => `screen:${defaultName}`,
    }).registerNavigationContainer(c);

    expect(trackSpy).toHaveBeenCalledWith('screen:Home', undefined);
  });

  it('suppresses tracking when viewNamePredicate returns null', () => {
    const c = fakeContainer({ name: 'Secret', key: 'k' });

    reactNavigationIntegration({
      viewNamePredicate: (route, defaultName) =>
        route.name === 'Secret' ? null : defaultName,
    }).registerNavigationContainer(c);

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('respects shouldTrackView', () => {
    const c = fakeContainer({ name: 'Skip', key: 'k' });

    reactNavigationIntegration({
      shouldTrackView: (route) => route.name !== 'Skip',
    }).registerNavigationContainer(c);

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('never propagates a throwing predicate into the navigation dispatch', () => {
    const c = fakeContainer({ name: 'Home', key: 'Home-1' });
    const boom = () => {
      throw new Error('consumer predicate blew up');
    };

    const integration = reactNavigationIntegration({
      viewNamePredicate: boom as never,
    });

    // Initial capture (called synchronously here) must not throw.
    expect(() => integration.registerNavigationContainer(c)).not.toThrow();

    // A subsequent state change firing our listener must not throw either.
    c._set({ name: 'Detail', key: 'Detail-1' });
    expect(() => c._emit()).not.toThrow();

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('isolates a throwing attributesFromRoute', () => {
    const c = fakeContainer({ name: 'Home', key: 'Home-1' });

    const integration = reactNavigationIntegration({
      attributesFromRoute: () => {
        throw new Error('attr resolver blew up');
      },
    });

    expect(() => integration.registerNavigationContainer(c)).not.toThrow();
    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes attributes from attributesFromRoute', () => {
    const c = fakeContainer({ name: 'Detail', key: 'k', params: { id: 42 } });

    reactNavigationIntegration({
      attributesFromRoute: (route) => ({
        'route.id': String((route.params as { id?: number } | undefined)?.id),
      }),
    }).registerNavigationContainer(c);

    expect(trackSpy).toHaveBeenCalledWith('Detail', { 'route.id': '42' });
  });

  it('accepts a ref object that holds the container', () => {
    const inner = fakeContainer({ name: 'Home', key: 'k' });

    reactNavigationIntegration().registerNavigationContainer({ current: inner });

    expect(trackSpy).toHaveBeenCalledWith('Home', undefined);
  });

  it('stops tracking after unregister', () => {
    const c = fakeContainer({ name: 'Home', key: 'Home-1' });
    const integration = reactNavigationIntegration();
    integration.registerNavigationContainer(c);
    trackSpy.mockClear();

    integration.unregisterNavigationContainer();
    expect(c._hasListener()).toBe(false);

    c._set({ name: 'Detail', key: 'Detail-1' });
    c._emit();
    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('removes the ready listener on unregister', () => {
    const c = fakeContainer({ name: 'Home', key: 'Home-1' }, { ready: false });
    const integration = reactNavigationIntegration();
    integration.registerNavigationContainer(c);
    expect(c._hasReadyListener()).toBe(true);

    integration.unregisterNavigationContainer();
    expect(c._hasReadyListener()).toBe(false);

    c._emitReady();
    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('warns and no-ops on an invalid container', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    reactNavigationIntegration().registerNavigationContainer(
      {} as unknown as Parameters<
        ReturnType<typeof reactNavigationIntegration>['registerNavigationContainer']
      >[0]
    );

    expect(warn).toHaveBeenCalled();
    expect(trackSpy).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('Navigation.track reserved-key sanitization', () => {
  it('strips reserved keys before bridging to native', async () => {
    const navigationTrack = NativeModule.navigationTrack as jest.Mock;
    navigationTrack.mockClear();

    await SplunkRum.instance.navigation.track('Checkout', {
      'component': 'should-strip',
      'navigation.name': 'should-strip',
      'screen.name': 'should-strip',
      'last.screen.name': 'should-strip',
      'order.total': 99.99,
    });

    expect(navigationTrack).toHaveBeenCalledWith('Checkout', {
      'order.total': 99.99,
    });
  });

  it('passes an empty object when no attributes are provided', async () => {
    const navigationTrack = NativeModule.navigationTrack as jest.Mock;
    navigationTrack.mockClear();

    await SplunkRum.instance.navigation.track('Home');

    expect(navigationTrack).toHaveBeenCalledWith('Home', {});
  });
});
