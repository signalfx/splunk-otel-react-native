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

import { setGlobalAttributes } from './globalAttributes';
import { SCREEN_NAME, LAST_SCREEN_NAME } from './attributeNames';
import { trace } from '@opentelemetry/api';

let current: string = 'none';

export function getCurrentView() {
  return current;
}

//TODO types
export function startNavigationTracking(navigationRef: any) {
  const tracer = trace.getTracer('uiChanges');
  current = navigationRef.getCurrentRoute()?.name;
  setGlobalAttributes({ [SCREEN_NAME]: current });
  createUiSpan(tracer);

  if (navigationRef) {
    navigationRef.addListener('state', () => {
      const previous = current;
      current = navigationRef.getCurrentRoute().name;
      setGlobalAttributes({
        [SCREEN_NAME]: current,
      });
      createUiSpan(tracer, previous);
    });
  } else {
    //TODO Maybe TS is enough
  }
}

function createUiSpan(tracer: any, previous?: string) {
  const span = tracer.startSpan('Created');
  span.setAttribute('component', 'ui');
  if (previous) {
    span.setAttribute(LAST_SCREEN_NAME, previous);
  }
  span.end();
}
