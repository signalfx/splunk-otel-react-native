/*
 * Copyright 2025 Splunk Inc.
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
import {
  getActiveRouteName,
  reactNavigationIntegration,
} from '../integrations/reactNavigation';

/** Minimal fake of a react-navigation container ref for driving the integration. */
function fakeContainer(initialRoute?: {
  name: string;
  key?: string;
  params?: object;
}) {
  let current = initialRoute;
  let listener: (() => void) | undefined;

  return {
    getCurrentRoute: () => current,
    addListener: (_type: 'state', cb: () => void) => {
      listener = cb;
      return () => {
        listener = undefined;
      };
    },
    // test helpers
    _set: (route?: { name: string; key?: string; params?: object }) => {
      current = route;
    },
    _emit: () => listener?.(),
    _hasListener: () => listener !== undefined,
  };
}

describe('getActiveRouteName', () => {
  it('returns undefined for missing or empty state', () => {
    expect(getActiveRouteName(undefined)).toBeUndefined();
    expect(getActiveRouteName({ routes: [] })).toBeUndefined();
  });

  it('returns the focused top-level route', () => {
    expect(
      getActiveRouteName({ index: 1, routes: [{ name: 'A' }, { name: 'B' }] })
    ).toBe('B');
  });

  it('descends into nested navigators', () => {
    const state = {
      index: 0,
      routes: [
        {
          name: 'Tabs',
          state: { index: 1, routes: [{ name: 'Home' }, { name: 'Detail' }] },
        },
      ],
    };
    expect(getActiveRouteName(state)).toBe('Detail');
  });

  it('falls back to the last route when index is missing', () => {
    expect(getActiveRouteName({ routes: [{ name: 'A' }, { name: 'B' }] })).toBe(
      'B'
    );
  });
});

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
