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
