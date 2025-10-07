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

import type { SpanProcessor, Span } from '@opentelemetry/sdk-trace-base';
import { getGlobalAttributes } from './globalAttributes';

export default class GlobalAttributeAppender implements SpanProcessor {
  forceFlush(): Promise<void> {
    return Promise.resolve();
  }

  onEnd(): void {}

  onStart(span: Span): void {
    span.setAttributes(getGlobalAttributes());
    span.setAttribute('_splunk_operation', span.name);
  }
  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}
