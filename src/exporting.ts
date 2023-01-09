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

import { diag } from '@opentelemetry/api';
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
    diag.debug(
      'Exporting:zipkinTonativeSpan',
      zipkinSpan.name,
      zipkinSpan.duration / 1e6
    );
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
    nSpan.attributes._splunk_operation = span.name;
    diag.debug('Exporting:toNativeSpan: ', nSpan.name, span.duration);
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
