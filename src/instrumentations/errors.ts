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

const STACK_LIMIT = 4096;
const MESSAGE_LIMIT = 1024;

export function instrumentErrors() {
  const tracer = trace.getTracer('error');

  ErrorUtils.setGlobalHandler((err: any, isFatal?: boolean) => {
    const msg = err.message || err.toString();

    const attributes = {
      'error.isFatal': isFatal,
      'error.message': limitLen(msg, MESSAGE_LIMIT),
      'error.object': useful(err.name)
        ? err.name
        : err.constructor && err.constructor.name
        ? err.constructor.name
        : 'Error',
      'error': true, //TODO do we use this?
      'component': 'error',
    };

    if (err.stack && useful(err.stack)) {
      (attributes as any)['error.stack'] = limitLen(
        err.stack.toString(),
        STACK_LIMIT
      );
    }

    tracer.startSpan('error', { attributes }).end();
  });
}

function limitLen(s: string, cap: number): string {
  if (s.length > cap) {
    return s.substring(0, cap);
  } else {
    return s;
  }
}

function useful(s: any) {
  return s && s.trim() !== '' && !s.startsWith('[object') && s !== 'error';
}
