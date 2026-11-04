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

import React, { Component, type ComponentType, type ReactNode } from 'react';
import { ErrorSource } from '../api/CustomTracking';
import { SplunkRum } from '../api/SplunkRum';

export interface SplunkErrorBoundaryProps {
  /**
   * UI to render when an error is caught.
   *
   * Pass a ReactNode for a static fallback, or a function to receive the error:
   * ```tsx
   * fallback={(error) => <Text>Something went wrong: {error.message}</Text>}
   * ```
   */
  fallback?: ReactNode | ((error: Error) => ReactNode);

  /**
   * Called after the error is reported to RUM.
   *
   * Use this to log additional context or show an alert.
   */
  onError?: (error: Error, info: React.ErrorInfo) => void;

  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Error boundary that catches React render/lifecycle errors and reports them
 * to Splunk RUM as error spans.
 *
 * Errors caught here never reach the global `ErrorUtils` handler because React
 * recovers them internally. This boundary is the only way to capture them.
 *
 * The component tree is kept alive (app does not crash), so
 * `exception.escaped` is `false` to distinguish these from fatal JS exceptions.
 *
 * @example Basic usage with static fallback
 * ```tsx
 * <SplunkErrorBoundary fallback={<Text>Something went wrong</Text>}>
 *   <MyFeature />
 * </SplunkErrorBoundary>
 * ```
 *
 * @example Dynamic fallback
 * ```tsx
 * <SplunkErrorBoundary fallback={(err) => <ErrorScreen message={err.message} />}>
 *   <MyFeature />
 * </SplunkErrorBoundary>
 * ```
 */
export class SplunkErrorBoundary extends Component<
  SplunkErrorBoundaryProps,
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // TODO(react-native-crash-reporting): Add a terminal catch that reports only
    // through internal/debug logging. A native bridge rejection currently becomes
    // an unhandled promise rejection and can be captured again as an app error.
    void SplunkRum.instance.customTracking.trackError(error, {
      source: ErrorSource.Source,
      handled: true,
      attributes: {
        'error.layer': 'javascript',
        'error.type': 'react_render_error',
        'error.capture': 'errorBoundary',
        'error.is_fatal': false,
        'exception.escaped': false,
      },
    });

    try {
      this.props.onError?.(error, info);
    } catch {
      // Swallow — boundary callbacks must not re-throw
    }
  }

  render(): ReactNode {
    const { error } = this.state;

    if (error !== null) {
      const { fallback } = this.props;
      if (typeof fallback === 'function') {
        return fallback(error);
      }
      return fallback ?? null;
    }

    return this.props.children;
  }
}

/**
 * Higher-order component that wraps `WrappedComponent` in a `SplunkErrorBoundary`.
 *
 * Useful when you cannot modify JSX directly (third-party components, dynamic rendering).
 *
 * @example
 * ```tsx
 * const SafeFeature = withSplunkErrorBoundary(MyFeature, {
 *   fallback: <Text>Feature unavailable</Text>,
 * });
 *
 * // Then use as normal:
 * <SafeFeature someProp="value" />
 * ```
 */
export function withSplunkErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  boundaryProps?: Omit<SplunkErrorBoundaryProps, 'children'>
): ComponentType<P> {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WithErrorBoundary(props: P) {
    return (
      <SplunkErrorBoundary {...boundaryProps}>
        <WrappedComponent {...props} />
      </SplunkErrorBoundary>
    );
  }

  WithErrorBoundary.displayName = `withSplunkErrorBoundary(${displayName})`;
  return WithErrorBoundary;
}
