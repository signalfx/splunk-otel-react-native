/*
Copyright 2022 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import type { Span } from '@opentelemetry/api';

function addMatchToSpan(match: RegExpMatchArray | null, span: Span): void {
  if (match && match[1] && match[2]) {
    const traceId = match[1];
    const spanId = match[2];
    span.setAttribute('link.traceId', traceId);
    span.setAttribute('link.spanId', spanId);
  }
}

const HeaderRegex = new RegExp(
  'traceparent;desc=[\'"]00-([0-9a-f]{32})-([0-9a-f]{16})-01[\'"]'
);

export function captureTraceParent(
  serverTimingValues: string,
  span: Span
): void {
  // getResponseHeader returns multiple Server-Timing headers concat with ', ' (note space)
  // fetch returns concat with ','.
  // split the difference
  for (let header of serverTimingValues.split(',')) {
    header = header.trim();
    const match = header.match(HeaderRegex);
    addMatchToSpan(match, span);
  }
}
