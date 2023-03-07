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
import { SCREEN_NAME, LAST_SCREEN_NAME } from './splunkAttributeNames';
import { trace, diag, Tracer } from '@opentelemetry/api';

let currentRouteName: string = 'none';
let tracer: Tracer;

export function getCurrentView() {
  return currentRouteName;
}

export function startNavigationTracking(navigationRef: any) {
  if (navigationRef) {
    tracer = trace.getTracer('uiChanges');
    const startingRoute = navigationRef.getCurrentRoute();
    if (startingRoute) {
      currentRouteName = startingRoute.name;
      createUiSpan(currentRouteName);
    }

    navigationRef.addListener('state', () => {
      const previous = currentRouteName;
      const route = navigationRef.getCurrentRoute();
      if (route) {
        currentRouteName = route.name;
        createUiSpan(currentRouteName, previous);
      }
    });
  } else {
    diag.debug('Navigation: navigationRef missing');
  }
}

function createUiSpan(current: string, previous?: string) {
  setGlobalAttributes({ [SCREEN_NAME]: current });
  // global attrs will get appended to this span anyways
  const span = tracer.startSpan('Created');
  span.setAttribute('component', 'ui');
  if (previous) {
    span.setAttribute(LAST_SCREEN_NAME, previous);
  }
  span.end();
}
