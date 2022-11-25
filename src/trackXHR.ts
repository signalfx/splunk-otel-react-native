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

import { trace } from '@opentelemetry/api';
import { captureTraceParent } from './serverTiming';

const originalOpen = XMLHttpRequest.prototype.open;
const originalSend = XMLHttpRequest.prototype.send;

export function startXHRTracking() {
  const tracer = trace.getTracer('xhr');

  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args) {
    const attributes = {
      'http.method': args[0],
      'http.url': args[1],
      'component': 'http',
    };

    const span = tracer.startSpan(`HTTP ${args[0].toUpperCase()}`, {
      attributes,
    });
    this.addEventListener('readystatechange', () => {
      if (this.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
        const headers = this.getAllResponseHeaders().toLowerCase();
        if (headers.indexOf('server-timing') !== -1) {
          const st = this.getResponseHeader('server-timing');
          if (st !== null) {
            captureTraceParent(st, span);
          }
        }
      }
      if (this.readyState === XMLHttpRequest.DONE) {
        span.setAttribute('http.status_code', this.status);
        span.end();
      }
    });

    originalOpen.apply(this, args);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    originalSend.apply(this, args);
  };
}
