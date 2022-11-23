import type { SpanProcessor, Span } from '@opentelemetry/sdk-trace-base';
import { getGlobalAttributes } from './globalAttributes';

export default class GlobalAttributeAppender implements SpanProcessor {
  forceFlush(): Promise<void> {
    return Promise.resolve();
  }

  onEnd(): void {}

  onStart(span: Span): void {
    span.setAttributes(getGlobalAttributes());
  }
  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}
