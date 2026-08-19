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

import {
  MESSAGE_MAX_LENGTH,
  STACK_MAX_LENGTH,
  MAX_FRAMES,
  normalizeError,
  parseStackFrames,
  truncate,
} from '../bridge/stacktrace';

describe('parseStackFrames', () => {
  it('parses V8 / Chrome frames (named and anonymous)', () => {
    const stack = [
      'Error: x is not a function',
      '    at f (/data/app/index.bundle:1234:56)',
      '    at Object.<anonymous> (/data/app/app.js:10:5)',
      '    at /data/app/runtime.js:99:1',
    ].join('\n');

    const frames = parseStackFrames(stack);

    // The leading "Error: ..." message line is skipped.
    expect(frames).toEqual([
      {
        function: 'f',
        file: '/data/app/index.bundle',
        lineno: 1234,
        colno: 56,
        platform: 'javascript',
      },
      {
        function: 'Object.<anonymous>',
        file: '/data/app/app.js',
        lineno: 10,
        colno: 5,
        platform: 'javascript',
      },
      {
        function: undefined,
        file: '/data/app/runtime.js',
        lineno: 99,
        colno: 1,
        platform: 'javascript',
      },
    ]);
  });

  it('parses JSC (iOS, non-Hermes) frames', () => {
    const stack = [
      'f@/data/app/index.bundle:1234:56',
      'global code@/data/app/app.js:10:5',
      '@/data/app/anon.js:1:2',
    ].join('\n');

    const frames = parseStackFrames(stack);

    expect(frames).toEqual([
      {
        function: 'f',
        file: '/data/app/index.bundle',
        lineno: 1234,
        colno: 56,
        platform: 'javascript',
      },
      {
        function: 'global code',
        file: '/data/app/app.js',
        lineno: 10,
        colno: 5,
        platform: 'javascript',
      },
      {
        function: undefined,
        file: '/data/app/anon.js',
        lineno: 1,
        colno: 2,
        platform: 'javascript',
      },
    ]);
  });

  it('parses Hermes release bytecode frames (byte offset in column)', () => {
    const stack = [
      'TypeError: undefined is not a function',
      '    at f (address at /data/app/index.android.bundle:1:537284)',
      '    at anonymous (address at /data/app/index.android.bundle:1:1000)',
    ].join('\n');

    const frames = parseStackFrames(stack);

    expect(frames).toEqual([
      {
        function: 'f',
        file: '/data/app/index.android.bundle',
        lineno: 1,
        colno: 537284,
        platform: 'javascript',
      },
      {
        function: 'anonymous',
        file: '/data/app/index.android.bundle',
        lineno: 1,
        colno: 1000,
        platform: 'javascript',
      },
    ]);
  });

  it('keeps file URLs containing a scheme/port intact', () => {
    const frames = parseStackFrames('    at g (http://localhost:8081/index.bundle:1:2)');

    expect(frames).toEqual([
      {
        function: 'g',
        file: 'http://localhost:8081/index.bundle',
        lineno: 1,
        colno: 2,
        platform: 'javascript',
      },
    ]);
  });

  it('returns an empty array for empty/undefined/null input', () => {
    expect(parseStackFrames('')).toEqual([]);
    expect(parseStackFrames(undefined)).toEqual([]);
    expect(parseStackFrames(null)).toEqual([]);
  });

  it('caps the number of parsed frames', () => {
    const line = '    at f (/a/b.js:1:1)';
    const stack = Array.from({ length: MAX_FRAMES + 50 }, () => line).join('\n');

    expect(parseStackFrames(stack)).toHaveLength(MAX_FRAMES);
  });
});

describe('normalizeError', () => {
  it('normalizes a real Error', () => {
    const error = new TypeError('boom');
    const result = normalizeError(error);

    expect(result.type).toBe('TypeError');
    expect(result.message).toBe('boom');
    expect(typeof result.stack).toBe('string');
    expect(result.stack.length).toBeGreaterThan(0);
  });

  it('normalizes a string into a message-only payload', () => {
    expect(normalizeError('manual report')).toEqual({
      type: 'Error',
      message: 'manual report',
      stack: '',
    });
  });

  it('normalizes an Error-like object without a name via its constructor', () => {
    class CustomError extends Error {}
    const err = new CustomError('oops');
    // Force the name off for the constructor fallback path.
    Object.defineProperty(err, 'name', { value: '' });

    const result = normalizeError(err);

    expect(result.type).toBe('CustomError');
    expect(result.message).toBe('oops');
  });

  it('normalizes an arbitrary thrown value', () => {
    const result = normalizeError(42);

    expect(result.type).toBe('Error');
    expect(result.message).toBe('42');
    expect(result.stack).toBe('');
  });

  it('truncates an oversized message', () => {
    const long = 'a'.repeat(MESSAGE_MAX_LENGTH + 100);
    const result = normalizeError(long);

    expect(result.message).toHaveLength(MESSAGE_MAX_LENGTH);
  });

  it('truncates an oversized stack', () => {
    const error = new Error('boom');
    error.stack = 'x'.repeat(STACK_MAX_LENGTH + 100);

    const result = normalizeError(error);

    expect(result.stack).toHaveLength(STACK_MAX_LENGTH);
  });
});

describe('truncate', () => {
  it('leaves short strings unchanged', () => {
    expect(truncate('short', 10)).toBe('short');
  });

  it('truncates long strings to the limit', () => {
    expect(truncate('abcdef', 3)).toBe('abc');
  });
});
