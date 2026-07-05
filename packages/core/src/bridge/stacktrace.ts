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

/**
 * Maximum length for an error message before it is truncated.
 *
 * Mirrors the native iOS cap so the value is bounded before it crosses the
 * bridge. `exception.message` is truncated before the stack (the stack is the
 * higher-value symbolication input).
 */
export const MESSAGE_MAX_LENGTH = 4096;

/**
 * Maximum length for a serialized stacktrace before it is truncated.
 *
 * Bounded to respect OTLP/collector attribute limits while preferring to keep
 * as much of the stack as possible (it is the raw symbolication input).
 */
export const STACK_MAX_LENGTH = 16384;

/**
 * Maximum number of parsed frames transported across the bridge.
 *
 * Keeps the structured-frames payload bounded for deep recursion stacks.
 */
export const MAX_FRAMES = 100;

/**
 * A single normalized stack frame.
 *
 * The shape is engine-agnostic: a best-effort parse of `Error.stack` for
 * JavaScriptCore (JSC), V8/Chrome, and Hermes. For Hermes release bytecode the
 * byte offset lands in `colno` and `lineno` is usually `1`.
 */
export interface StackFrame {
  /** Raw (possibly minified) function/symbol name, if present. */
  function?: string;
  /** Bundle path or URL the frame points into. */
  file?: string;
  /** 1-based line number. */
  lineno?: number;
  /** 1-based column number; the Hermes byte offset lands here. */
  colno?: number;
  /** Always `javascript` for frames captured on the RN layer. */
  platform: 'javascript';
}

/**
 * A captured error normalized into the fields transported across the bridge.
 */
export interface NormalizedError {
  /** Maps to `exception.type` (e.g. `TypeError`). */
  type: string;
  /** Maps to `exception.message`. */
  message: string;
  /** Raw `Error.stack`, truncated. Maps to `exception.stacktrace`. */
  stack: string;
}

/**
 * Truncates a string to at most `max` characters.
 */
export function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }

  return value.slice(0, max);
}

function parseLocation(location: string, fn?: string): StackFrame | null {
  // Hermes prefixes bytecode locations with "address at ".
  const loc = location.replace(/^address at /, '').trim();

  const withColumn = loc.match(/^(.*):(\d+):(\d+)$/);
  if (withColumn) {
    return {
      function: fn,
      file: withColumn[1],
      lineno: Number(withColumn[2]),
      colno: Number(withColumn[3]),
      platform: 'javascript',
    };
  }

  const withLine = loc.match(/^(.*):(\d+)$/);
  if (withLine) {
    return {
      function: fn,
      file: withLine[1],
      lineno: Number(withLine[2]),
      platform: 'javascript',
    };
  }

  if (fn) {
    return { function: fn, platform: 'javascript' };
  }

  return null;
}

function parseFrame(line: string): StackFrame | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) {
    return null;
  }

  // V8 / Hermes: "at fnName (location)" or "at location".
  const atMatch = trimmed.match(/^at\s+(.*)$/);
  if (atMatch) {
    const rest = atMatch[1] ?? '';
    const parenStart = rest.lastIndexOf(' (');

    if (parenStart !== -1 && rest.endsWith(')')) {
      const fn = rest.slice(0, parenStart).trim() || undefined;
      const loc = rest.slice(parenStart + 2, -1);
      return parseLocation(loc, fn);
    }

    return parseLocation(rest);
  }

  // JSC (iOS, non-Hermes): "fnName@location" or "@location".
  const atIndex = trimmed.indexOf('@');
  if (atIndex !== -1) {
    const fn = trimmed.slice(0, atIndex).trim() || undefined;
    const loc = trimmed.slice(atIndex + 1);
    return parseLocation(loc, fn);
  }

  return null;
}

/**
 * Parses an `Error.stack` string into structured frames.
 *
 * Engine-agnostic best effort across JSC, V8/Chrome, and Hermes. Lines that
 * cannot be parsed (e.g. the leading message line) are skipped. Never throws;
 * returns an empty array for an empty/undefined stack.
 *
 * @param stack - The raw `Error.stack` string.
 * @returns Parsed frames, capped at {@link MAX_FRAMES}.
 */
export function parseStackFrames(
  stack: string | undefined | null
): StackFrame[] {
  if (!stack) {
    return [];
  }

  const frames: StackFrame[] = [];
  const lines = stack.split('\n');

  for (const line of lines) {
    if (frames.length >= MAX_FRAMES) {
      break;
    }

    const frame = parseFrame(line);
    if (frame) {
      frames.push(frame);
    }
  }

  return frames;
}

function deriveType(error: {
  name?: unknown;
  constructor?: { name?: string };
}): string {
  if (typeof error.name === 'string' && error.name.length > 0) {
    return error.name;
  }

  const ctorName = error.constructor?.name;
  if (typeof ctorName === 'string' && ctorName.length > 0) {
    return ctorName;
  }

  return 'Error';
}

/**
 * Normalizes an arbitrary thrown value into the bridge payload fields.
 *
 * Accepts a real `Error`, a string, or any object/value (JS can throw
 * anything). Always produces a valid payload; never throws.
 *
 * The raw stack is transported verbatim as the symbolication input; structured
 * frames are parsed separately via {@link parseStackFrames} (reserved for a
 * later phase, so they are not computed here).
 *
 * @param input - The caught value or a message string.
 * @returns The normalized type, message, and truncated stack.
 */
export function normalizeError(input: unknown): NormalizedError {
  if (typeof input === 'string') {
    return {
      type: 'Error',
      message: truncate(input, MESSAGE_MAX_LENGTH),
      stack: '',
    };
  }

  if (input !== null && typeof input === 'object') {
    const error = input as {
      name?: unknown;
      message?: unknown;
      stack?: unknown;
      constructor?: { name?: string };
    };

    const message =
      typeof error.message === 'string' ? error.message : String(input);
    const rawStack = typeof error.stack === 'string' ? error.stack : '';

    return {
      type: deriveType(error),
      message: truncate(message, MESSAGE_MAX_LENGTH),
      stack: truncate(rawStack, STACK_MAX_LENGTH),
    };
  }

  return {
    type: 'Error',
    message: truncate(String(input), MESSAGE_MAX_LENGTH),
    stack: '',
  };
}
