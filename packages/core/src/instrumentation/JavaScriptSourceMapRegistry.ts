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

const SOURCE_MAP_IDS_ATTRIBUTE = 'error.sourceMapIds';
const PLATFORM_ATTRIBUTE = 'splunk.rum.platform';
const BUNDLE_ORIGIN_ATTRIBUTE = 'splunk.rum.js.bundle.origin';
const JS_ENGINE_ATTRIBUTE = 'splunk.rum.js.engine';
const MAX_REGISTRATIONS = 128;
const MAX_SERIALIZED_BYTES = 16 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function addJavaScriptArtifactContext(
  attributes: Attributes
): Attributes {
  const sourceMapIds = snapshotRuntimeSourceMapIds();
  return {
    ...attributes,
    [PLATFORM_ATTRIBUTE]: 'react-native',
    [BUNDLE_ORIGIN_ATTRIBUTE]: 'embedded',
    [JS_ENGINE_ATTRIBUTE]: isHermesRuntime() ? 'hermes' : 'jsc',
    ...(Object.keys(sourceMapIds).length > 0
      ? { [SOURCE_MAP_IDS_ATTRIBUTE]: JSON.stringify(sourceMapIds) }
      : {}),
  };
}

export function snapshotRuntimeSourceMapIds(): Record<string, string> {
  const registrations = (
    globalThis as typeof globalThis & {
      __splunkRumSourceMapRegistrations?: unknown;
    }
  ).__splunkRumSourceMapRegistrations;
  if (
    !registrations ||
    typeof registrations !== 'object' ||
    Array.isArray(registrations)
  ) {
    return {};
  }

  const result: Record<string, string> = {};
  const ambiguousSelectors = new Set<string>();
  const entries = Object.entries(
    registrations as Record<string, unknown>
  ).slice(-MAX_REGISTRATIONS);
  for (const [registrationStack, sourceMapId] of entries) {
    if (typeof sourceMapId !== 'string' || !UUID.test(sourceMapId)) continue;
    const selector = selectBundleName(registrationStack);
    if (!selector) continue;
    if (ambiguousSelectors.has(selector)) continue;
    const existing = result[selector];
    if (existing && existing !== sourceMapId) {
      delete result[selector];
      ambiguousSelectors.add(selector);
      continue;
    }
    result[selector] = sourceMapId;
    if (JSON.stringify(result).length > MAX_SERIALIZED_BYTES) {
      delete result[selector];
      break;
    }
  }

  return Object.fromEntries(
    Object.entries(result).sort(([left], [right]) => left.localeCompare(right))
  );
}

function selectBundleName(registrationStack: string): string | null {
  for (const line of registrationStack.split('\n')) {
    const match = line.match(
      /(?:address at )?([^()@\s]+\.(?:bundle|jsbundle|js))(?::\d+){1,2}/i
    );
    if (!match?.[1]) continue;
    const selector = selectorFromStackPath(match[1]);
    if (selector) return selector;
  }
  return null;
}

function selectorFromStackPath(value: string): string | null {
  const path = value.replace(/^file:\/\//, '');
  const logical = normalizeLogicalPath(path);
  if (logical) return logical;
  const basename = path.split(/[\\/]/).filter(Boolean).pop();
  return basename ? normalizeLogicalPath(basename) : null;
}

function isHermesRuntime(): boolean {
  return Boolean(
    (globalThis as typeof globalThis & { HermesInternal?: unknown })
      .HermesInternal
  );
}

function normalizeLogicalPath(value: string): string | null {
  const normalized = value.trim().replace(/\\/g, '/').replace(/\/+/g, '/');
  if (
    !normalized ||
    normalized.startsWith('/') ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized.includes('?') ||
    normalized.includes('#') ||
    normalized.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    return null;
  }
  return normalized;
}
