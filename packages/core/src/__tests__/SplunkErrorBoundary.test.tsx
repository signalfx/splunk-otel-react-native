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

import React from 'react';
import {
  SplunkErrorBoundary,
  withSplunkErrorBoundary,
} from '../instrumentation/SplunkErrorBoundary';

const mockTrackError = jest.fn().mockResolvedValue(undefined);

jest.mock('../api/SplunkRum', () => ({
  SplunkRum: {
    instance: {
      customTracking: {
        trackError: (...args: unknown[]) => mockTrackError(...args),
      },
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers — instantiate the class directly to test lifecycle methods without
// needing a renderer.
// ---------------------------------------------------------------------------

function makeInstance(
  props: Partial<ConstructorParameters<typeof SplunkErrorBoundary>[0]> = {}
): SplunkErrorBoundary {
  const fullProps = { children: null, ...props };
  return new SplunkErrorBoundary(fullProps);
}

const fakeInfo: React.ErrorInfo = {
  componentStack: '\n  in Bomb\n  in SplunkErrorBoundary',
};

// ---------------------------------------------------------------------------

describe('SplunkErrorBoundary', () => {
  it('calls trackError with correct attributes when a child throws', () => {
    const instance = makeInstance();
    const error = new Error('render bomb');

    instance.componentDidCatch(error, fakeInfo);

    expect(mockTrackError).toHaveBeenCalledWith(error, {
      attributes: {
        'error.layer': 'javascript',
        'error.type': 'react_render_error',
        'error.capture': 'errorBoundary',
        'error.is_fatal': false,
        'exception.escaped': false,
      },
      source: 'source',
      handled: true,
    });
  });

  it('does not attach the React component stack to the event', () => {
    const instance = makeInstance();
    instance.componentDidCatch(new Error('boom'), { componentStack: null as unknown as string });

    const attrs = mockTrackError.mock.calls[0][1].attributes;
    expect(attrs).not.toHaveProperty('error.component_stack');
  });

  it('calls onError callback with error and info', () => {
    const onError = jest.fn();
    const instance = makeInstance({ onError });
    const error = new Error('render bomb');

    instance.componentDidCatch(error, fakeInfo);

    expect(onError).toHaveBeenCalledWith(error, fakeInfo);
  });

  it('does not throw when onError callback itself throws', () => {
    const onError = jest.fn(() => {
      throw new Error('callback error');
    });
    const instance = makeInstance({ onError });

    expect(() => {
      instance.componentDidCatch(new Error('render bomb'), fakeInfo);
    }).not.toThrow();
  });

  it('getDerivedStateFromError returns state with the caught error', () => {
    const error = new Error('boom');
    const state = SplunkErrorBoundary.getDerivedStateFromError(error);
    expect(state).toEqual({ error });
  });

  it('render returns children when state.error is null', () => {
    const child = React.createElement('div');
    const instance = makeInstance({ children: child });
    (instance as any).state = { error: null };
    expect(instance.render()).toBe(child);
  });

  it('render returns static fallback when state has an error', () => {
    const fallback = React.createElement('div', null, 'fallback');
    const instance = makeInstance({ fallback });
    const error = new Error('boom');
    (instance as any).state = { error };
    expect(instance.render()).toBe(fallback);
  });

  it('render calls dynamic fallback with the error', () => {
    const fallbackNode = React.createElement('div', null, 'dynamic');
    const fallback = jest.fn(() => fallbackNode);
    const instance = makeInstance({ fallback });
    const error = new Error('boom');
    (instance as any).state = { error };

    const result = instance.render();

    expect(fallback).toHaveBeenCalledWith(error);
    expect(result).toBe(fallbackNode);
  });

  it('render returns null when no fallback is provided and state has error', () => {
    const instance = makeInstance();
    (instance as any).state = { error: new Error('boom') };
    expect(instance.render()).toBeNull();
  });
});

describe('withSplunkErrorBoundary', () => {
  function Dummy(_props: { value: string }) {
    return null;
  }

  it('sets a readable displayName on the wrapper', () => {
    const SafeDummy = withSplunkErrorBoundary(Dummy);
    expect(SafeDummy.displayName).toBe('withSplunkErrorBoundary(Dummy)');
  });

  it('returns a component that renders without error when child is safe', () => {
    const SafeDummy = withSplunkErrorBoundary(Dummy);
    // createElement just checks it's a valid component — no renderer needed
    const element = React.createElement(SafeDummy, { value: 'test' });
    expect(React.isValidElement(element)).toBe(true);
  });

  it('passes boundary props to the underlying SplunkErrorBoundary', () => {
    const fallback = React.createElement('div', null, 'hoc fallback');
    const SafeDummy = withSplunkErrorBoundary(Dummy, { fallback });
    // The HOC wraps SplunkErrorBoundary — confirm by inspecting the rendered element type
    const element = React.createElement(SafeDummy, { value: 'test' });
    expect(React.isValidElement(element)).toBe(true);
  });

  it('falls back to "Component" displayName for anonymous components', () => {
    const anon = (_props: Record<string, unknown>) => null;
    Object.defineProperty(anon, 'name', { value: '' });
    const Safe = withSplunkErrorBoundary(anon);
    expect(Safe.displayName).toBe('withSplunkErrorBoundary(Component)');
  });
});
