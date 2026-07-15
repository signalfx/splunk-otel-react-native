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

import type { Attributes } from '@opentelemetry/api';
import { SplunkRum } from '../api/SplunkRum';

/**
 * Automatic navigation instrumentation for `react-navigation`.
 *
 * This integration detects focused-route changes in the JS layer and forwards
 * them to the native navigation module via `SplunkRum.instance.navigation`.
 * The native side builds the `app.ui.navigation` span and updates the shared
 * `screen.name` that is stamped onto all other telemetry (errors, crashes,
 * network spans, session replay).
 *
 * It is intentionally decoupled from `@react-navigation/native`: it never
 * imports the library (the `NavigationContainer` ref is passed in by the app)
 * and relies only on the structural `getCurrentRoute()` / `isReady()` /
 * `addListener('ready' | 'state')` surface, so it works across
 * react-navigation v6 and v7 (and structurally on v5) and adds no runtime
 * dependency. `@react-navigation/native` is declared only as an optional peer.
 */

/** Minimal shape of a `react-navigation` route this integration reads. */
export interface SplunkRoute {
  name: string;
  key?: string;
  params?: Record<string, unknown>;
}

/**
 * Minimal route shape as returned by react-navigation's `getCurrentRoute()`,
 * kept structurally compatible with its `Route<string>` (whose `params` is
 * typed as `object`).
 */
interface RouteLike {
  name: string;
  key?: string;
  params?: object;
}

/** Structural view of the `react-navigation` container we depend on. */
interface NavigationContainerLike {
  getCurrentRoute(): RouteLike | undefined;
  addListener(type: 'state' | 'ready', callback: () => void): unknown;
  /** Present on react-navigation v6/v7 container refs. */
  isReady?(): boolean;
}

/**
 * What {@link ReactNavigationIntegration.registerNavigationContainer} accepts:
 * react-navigation's `NavigationContainerRef` (from `useNavigationContainerRef`
 * / `createNavigationContainerRef`), a React ref object holding one, or any
 * structural equivalent.
 */
export type SplunkNavigationContainer =
  | NavigationContainerLike
  | { current: NavigationContainerLike | null | undefined };

export interface ReactNavigationIntegrationOptions {
  /**
   * Rename or drop a view. Return `null`/`undefined`/`''` to skip tracking
   * this route (the previous screen remains current). Defaults to the route
   * name.
   */
  viewNamePredicate?: (
    route: SplunkRoute,
    defaultName: string
  ) => string | null | undefined;

  /** Decide whether a route should be tracked at all. Defaults to `true`. */
  shouldTrackView?: (route: SplunkRoute) => boolean;

  /**
   * Extract attributes (e.g. selected route params) to attach to the
   * navigation event. Defaults to no attributes. Reserved keys are stripped by
   * the navigation API.
   */
  attributesFromRoute?: (route: SplunkRoute) => Attributes | undefined;

  /** Track the initial route when the container is registered. Defaults to `true`. */
  trackInitialRoute?: boolean;
}

export interface ReactNavigationIntegration {
  /**
   * Starts tracking a `react-navigation` container.
   *
   * Pass the ref from `useNavigationContainerRef()` /
   * `createNavigationContainerRef()` (recommended) or a ref object holding the
   * container. With those refs, registration may happen before the container is
   * ready: the initial screen is then captured from its `ready` event (or
   * `isReady()`), so it need not be called from `onReady`. A plain
   * `useRef(null)` only resolves once the container has mounted, so register it
   * from `onReady`. If no usable container is found, a warning is logged and
   * nothing is tracked. Only one container is tracked at a time. Registering a
   * new one replaces the previous.
   */
  registerNavigationContainer(container: SplunkNavigationContainer): void;

  /** Stops tracking the current container. */
  unregisterNavigationContainer(): void;
}

function resolveContainer(
  container: SplunkNavigationContainer | null | undefined
): NavigationContainerLike | undefined {
  if (!container) {
    return undefined;
  }

  const direct = container as Partial<NavigationContainerLike>;
  if (typeof direct.getCurrentRoute === 'function') {
    return container as NavigationContainerLike;
  }

  const holder = container as {
    current?: NavigationContainerLike | null;
  };
  if (holder.current && typeof holder.current.getCurrentRoute === 'function') {
    return holder.current;
  }

  return undefined;
}

/**
 * Creates a `react-navigation` integration.
 *
 * @example
 * ```tsx
 * const navigationRef = useNavigationContainerRef();
 * const splunkNavigation = useRef(reactNavigationIntegration());
 *
 * <NavigationContainer
 *   ref={navigationRef}
 *   onReady={() => splunkNavigation.current.registerNavigationContainer(navigationRef)}
 * >
 * ```
 */
export function reactNavigationIntegration(
  options: ReactNavigationIntegrationOptions = {}
): ReactNavigationIntegration {
  let container: NavigationContainerLike | undefined;
  let stateUnsubscribe: (() => void) | undefined;
  let readyUnsubscribe: (() => void) | undefined;
  let lastRouteKey: string | undefined;

  // Predicate evaluation order per a single committed route change is fixed:
  // (1) dedup by raw route key (in handleStateChange, before emit),
  // (2) viewNamePredicate (returning null/undefined/'' suppresses),
  // (3) shouldTrackView (false suppresses),
  // (4) attributesFromRoute, then native track().
  // The whole body is guarded: consumer-supplied predicates and the bridge call
  // must never throw into react-navigation's event dispatch (or the app's
  // onReady, which triggers the initial capture). A buggy predicate should
  // disable tracking for that event, not crash the host app.
  const emit = (route: SplunkRoute): void => {
    try {
      const defaultName = route.name;

      let name: string | null | undefined = defaultName;
      if (options.viewNamePredicate) {
        name = options.viewNamePredicate(route, defaultName);
      }
      if (name == null || name === '') {
        return;
      }

      if (options.shouldTrackView && !options.shouldTrackView(route)) {
        return;
      }

      const attributes = options.attributesFromRoute?.(route);

      const result = SplunkRum.instance.navigation.track(name, attributes);
      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
    } catch {
      // A consumer predicate or the bridge threw; swallow so navigation
      // tracking is best-effort and never destabilizes the app.
    }
  };

  // Invoked from react-navigation's 'state'/'ready' events and from the initial
  // capture in register(). Fully guarded so nothing escapes into the caller.
  const handleStateChange = (): void => {
    try {
      if (!container) {
        return;
      }

      const route = container.getCurrentRoute();
      if (!route || typeof route.name !== 'string') {
        return;
      }

      // Dedup by the focused route's key (falls back to name). This suppresses
      // param-only updates and no-op back navigations to the same screen (to
      // mirror our native Agents).
      const key = route.key ?? route.name;
      if (key === lastRouteKey) {
        return;
      }
      lastRouteKey = key;

      emit({
        name: route.name,
        key: route.key,
        params: route.params as Record<string, unknown> | undefined,
      });
    } catch {
      // getCurrentRoute() or downstream threw; never propagate into the
      // navigation event dispatch.
    }
  };

  // Records the current route's key without emitting. Used when the initial
  // route must not be tracked, so an unrelated state event on the same screen (e.g.
  // a `navigation.setOptions(...)` call) is deduped instead of being recorded as a new screen.
  const seedInitialRouteKey = (): void => {
    try {
      const route = container?.getCurrentRoute();
      if (route && typeof route.name === 'string') {
        lastRouteKey = route.key ?? route.name;
      }
    } catch {
      // ignore
    }
  };

  // Runs once when the container is ready: emits the initial route, or (when
  // trackInitialRoute is false) only seeds the dedup key so the initial screen
  // stays hidden even if a noop state event fires on it.
  const captureInitialRoute = (): void => {
    if (options.trackInitialRoute !== false) {
      handleStateChange();
    } else {
      seedInitialRouteKey();
    }
  };

  // Subscribes to a container event, tolerating containers/mocks that do not
  // return an unsubscribe function or do not support the event type.
  const subscribe = (
    c: NavigationContainerLike,
    type: 'state' | 'ready',
    listener: () => void
  ): (() => void) | undefined => {
    try {
      const result = c.addListener(type, listener);
      return typeof result === 'function' ? (result as () => void) : undefined;
    } catch {
      return undefined;
    }
  };

  const isContainerReady = (c: NavigationContainerLike): boolean => {
    // No isReady() (older/structural containers) -> assume ready and let
    // getCurrentRoute() gate emission.
    if (typeof c.isReady !== 'function') {
      return true;
    }

    try {
      return c.isReady();
    } catch {
      return true;
    }
  };

  const integration: ReactNavigationIntegration = {
    registerNavigationContainer(c) {
      const resolved = resolveContainer(c);
      if (!resolved) {
        if (__DEV__) {
          console.warn(
            '[SplunkRum] reactNavigationIntegration: invalid NavigationContainer ref. Navigation will not be tracked.'
          );
        }
        return;
      }

      if (stateUnsubscribe || readyUnsubscribe) {
        integration.unregisterNavigationContainer();
      }

      container = resolved;
      lastRouteKey = undefined;

      stateUnsubscribe = subscribe(resolved, 'state', handleStateChange);

      if (isContainerReady(resolved)) {
        // Ready now (e.g. registered from onReady): capture immediately.
        captureInitialRoute();
      } else {
        // Registered before the container is ready: capture the first screen once ready.
        readyUnsubscribe = subscribe(resolved, 'ready', captureInitialRoute);
      }
    },

    unregisterNavigationContainer() {
      for (const unsub of [stateUnsubscribe, readyUnsubscribe]) {
        if (unsub) {
          try {
            unsub();
          } catch {
            // ignore
          }
        }
      }

      stateUnsubscribe = undefined;
      readyUnsubscribe = undefined;

      container = undefined;
      lastRouteKey = undefined;
    },
  };

  return integration;
}
