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

export function startErrorTracking() {
  const tracer = trace.getTracer('rn-js-error');

  ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    console.log('Client:trackErrors:globalErrorHandler: ', error, isFatal);
    const attributes = {
      'error.isFatal': `${isFatal}`, //FIXME only support string attributes right now
      'error.message': getMessage(error),
      'error.stacktrace': getStacktrace(error),
      'component': 'error',
    };
    const span = tracer.startSpan('error', { attributes });
    span.end();
  });

  function getMessage(error: any) {
    let message = 'unknown';
    if (typeof error === 'object' && 'message' in error) {
      message = String(error.message);
    } else {
      message = String(error);
    }
    return message;
  }

  function getStacktrace(error: any) {
    let stacktrace = 'dummy_stacktrace';
    if (typeof error === 'object') {
      stacktrace = JSON.stringify(error);
    }
    return stacktrace;
  }
}
