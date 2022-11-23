import type { SpanExporter, ReadableSpan } from '@opentelemetry/sdk-trace-base';
import {
  ExportResult,
  ExportResultCode,
  hrTimeToMilliseconds,
} from '@opentelemetry/core';
import { Platform } from 'react-native';
import { exportSpanToNative } from './index';
import { toZipkinSpan } from './zipkintransform';
export default class ReacNativeSpanExporter implements SpanExporter {
  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void
  ): void {
    //FIXME unify this so ios and android are the same
    if (Platform.OS === 'ios') {
      exportSpanToNative(spans.map(this.toZipkin));
    } else {
      spans.forEach((span) => {
        exportSpanToNative(this.toNativeSpan(span));
      });
    }
    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  toZipkin(span: ReadableSpan) {
    const zipkinSpan = toZipkinSpan(span, 'servicenamegoeshere');
    console.log('CLIENT:zipkinTonativeSpan', zipkinSpan.name);
    return zipkinSpan;
  }

  toNativeSpan(span: ReadableSpan): object {
    const spanContext = span.spanContext();
    const nSpan = {
      name: span.name,
      tracerName: span.instrumentationLibrary.name,
      startTime: hrTimeToMilliseconds(span.startTime),
      endTime: hrTimeToMilliseconds(span.endTime),
      parentSpanId: span.parentSpanId,
      attributes: span.attributes,
      ...spanContext,
    };
    console.log(
      'CLIENT:toNativeSpan: ',
      nSpan.name,
      new Date(nSpan.startTime),
      new Date(nSpan.endTime)
    );
    return nSpan;
  }

  /**
   * Shutdown the exporter.
   */
  shutdown(): Promise<void> {
    //FIXME this._sendSpans([]);
    return Promise.resolve();
  }
}
