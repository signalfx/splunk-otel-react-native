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
