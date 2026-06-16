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
 * and relies only on the structural `getCurrentRoute()` / `addListener('state')`
 * surface, so it works across react-navigation v5–v7 and adds no runtime
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
  addListener(type: 'state', callback: () => void): unknown;
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
   * Starts tracking a `react-navigation` container. Call from the
   * container's `onReady` callback. Only one container is tracked at a time;
   * registering a new one replaces the previous.
   */
  registerNavigationContainer(container: SplunkNavigationContainer): void;

  /** Stops tracking the current container. */
  unregisterNavigationContainer(): void;
}

/** Minimal navigation-state shape for {@link getActiveRouteName}. */
interface NavigationStateLike {
  index?: number;
  routes?: ReadonlyArray<{
    name?: string;
    state?: NavigationStateLike;
  }>;
}

/**
 * Resolves the focused leaf route name from a navigation state, descending
 * through nested navigators (stacks/tabs). Pure helper, exported for testing
 * and for callers that work from `getRootState()` instead of a container ref.
 */
export function getActiveRouteName(
  state: NavigationStateLike | undefined
): string | undefined {
  if (!state || !state.routes || state.routes.length === 0) {
    return undefined;
  }

  const index =
    typeof state.index === 'number' && state.index >= 0
      ? state.index
      : state.routes.length - 1;
  const route = state.routes[index] ?? state.routes[state.routes.length - 1];

  if (route?.state) {
    return getActiveRouteName(route.state) ?? route.name;
  }

  return route?.name;
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
  let unsubscribe: (() => void) | undefined;
  let lastRouteKey: string | undefined;

  const emit = (route: SplunkRoute): void => {
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

    // Fire-and-forget; navigation tracking must never throw into app code.
    try {
      const result = SplunkRum.instance.navigation.track(name, attributes);
      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  const handleStateChange = (): void => {
    if (!container) {
      return;
    }

    let route: RouteLike | undefined;
    try {
      route = container.getCurrentRoute();
    } catch {
      route = undefined;
    }
    if (!route || typeof route.name !== 'string') {
      return;
    }

    // Dedup by the focused route's key (falls back to name). This suppresses
    // param-only updates and no-op back navigations to the same screen.
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
  };

  const integration: ReactNavigationIntegration = {
    registerNavigationContainer(c) {
      const resolved = resolveContainer(c);
      if (!resolved) {
        console.warn(
          '[SplunkRum] reactNavigationIntegration: invalid NavigationContainer ref; navigation will not be tracked.'
        );
        return;
      }

      if (unsubscribe) {
        integration.unregisterNavigationContainer();
      }

      container = resolved;
      lastRouteKey = undefined;

      const result = resolved.addListener('state', handleStateChange);
      unsubscribe =
        typeof result === 'function' ? (result as () => void) : undefined;

      if (options.trackInitialRoute !== false) {
        handleStateChange();
      }
    },

    unregisterNavigationContainer() {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch {
          // ignore
        }
      }
      unsubscribe = undefined;
      container = undefined;
      lastRouteKey = undefined;
    },
  };

  return integration;
}
