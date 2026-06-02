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

/** RFC 7230 section 3.2.6 `tchar` — valid HTTP header field-name characters. */
const HTTP_HEADER_TOKEN = /^[A-Za-z0-9!#$%&'*+\-.^_`|~]+$/;

type DropReason = 'empty' | 'invalid' | 'duplicate';

function dropMessage(
  reason: DropReason,
  index: number,
  source: string
): string {
  switch (reason) {
    case 'empty':
      return `SplunkRum: ignoring empty HTTP header name at index ${index} in ${source}.`;
    case 'invalid':
      return (
        `SplunkRum: ignoring invalid HTTP header name at index ${index} ` +
        `in ${source}. Header names must be RFC 7230 tokens. ` +
        `The provided value is not included to avoid ` +
        `leaking potentially sensitive data; check your configuration.`
      );
    case 'duplicate':
      return (
        `SplunkRum: ignoring duplicate HTTP header name at index ${index} ` +
        `in ${source} (case-insensitive match).`
      );
  }
}

function warn(
  debugLogging: boolean,
  reason: DropReason,
  index: number,
  source: string
) {
  if (debugLogging) {
    console.warn(dropMessage(reason, index, source));
  }
}

/**
 * Normalizes a list of HTTP header names before forwarding to the native agent.
 *
 * - Trims surrounding whitespace.
 * - Drops empty / whitespace-only entries.
 * - Drops entries that are not valid HTTP header field-name tokens (RFC 7230).
 * - De-duplicates case-insensitively (first occurrence wins).
 *
 * When `debugLogging` is `true`, dropped entries are reported via `console.warn`
 * with the reason, `source` field name, and originating list index. The
 * caller-provided value is intentionally never included in the log message:
 * if a consumer mistakenly passes a full header line such as
 * `Authorization: Bearer <token>`, echoing it would leak the secret to
 * device logs even though the value never reaches telemetry.
 */
export function sanitizeHeaderNames(
  names: string[],
  source: string,
  debugLogging: boolean
): string[] {
  const seen = new Set<string>();

  return names.reduce<string[]>((acc, raw, i) => {
    const trimmed = raw.trim();

    if (!trimmed) {
      warn(debugLogging, 'empty', i, source);
      return acc;
    }

    if (!HTTP_HEADER_TOKEN.test(trimmed)) {
      warn(debugLogging, 'invalid', i, source);
      return acc;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      warn(debugLogging, 'duplicate', i, source);
      return acc;
    }

    seen.add(key);
    acc.push(trimmed);
    return acc;
  }, []);
}

/**
 * Sanitizes and joins header names into a CSV string for the native bridge.
 * Returns an empty string when the sanitized list is empty.
 */
export function sanitizeAndJoinHeaders(
  names: string[],
  source: string,
  debugLogging: boolean
): string {
  return sanitizeHeaderNames(names, source, debugLogging).join(', ');
}
