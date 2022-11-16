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
