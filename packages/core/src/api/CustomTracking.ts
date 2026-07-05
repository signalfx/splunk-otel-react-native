/*
 * Copyright 2025 Splunk Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Attributes } from '@opentelemetry/api';
import { SplunkNativeBridge as Native } from '../sdk/SplunkNativeBridge';
import { normalizeError } from '../bridge/stacktrace';

/**
 * Origin of a reported error.
 *
 * Only {@link ErrorSource.Custom} is active in this phase; the remaining values
 * are reserved for automatic capture (Phase 2).
 */
export enum ErrorSource {
  /** Explicit application report via `trackError` (default). */
  Custom = 'custom',
  /** `console.error` capture (Phase 2). */
  Console = 'console',
  /** Global JS error handler (Phase 2). */
  Source = 'source',
  /** Failed network request mapped to an error (Phase 2). */
  Network = 'network',
}

/**
 * Options for {@link CustomTracking.trackError}.
 */
export interface ReportErrorOptions {
  /** Additional attributes attached to the error span. */
  attributes?: Attributes;
  /** Error origin. Defaults to {@link ErrorSource.Custom}. */
  source?: ErrorSource;
  /**
   * Whether the error was handled (non-fatal). Defaults to `true`.
   *
   * Emitted as the OTel `exception.escaped` attribute (`!handled`).
   */
  handled?: boolean;
  /** Capture time in epoch milliseconds. Defaults to `Date.now()`. */
  timestampMs?: number;
}

/**
 * Handle to an active workflow span.
 *
 * Call `end()` to complete the workflow and record its duration.
 */
export class WorkflowHandle {
  constructor(private readonly handle: number) {}

  /**
   * Ends the workflow span.
   *
   * Records the workflow duration from `startWorkflow()` to this call.
   */
  async end(): Promise<void> {
    return Native.customEndWorkflow(this.handle);
  }
}

/**
 * Custom event and workflow tracking.
 *
 * Use to capture business events and measure user workflows.
 *
 * @example Custom event
 * ```typescript
 * await SplunkRum.instance.customTracking.trackCustomEvent('checkout_complete', {
 *   'order.total': 99.99,
 *   'order.items': 3,
 * });
 * ```
 *
 * @example Workflow timing
 * ```typescript
 * const workflow = await SplunkRum.instance.customTracking.startWorkflow('checkout');
 * // ... user completes checkout ...
 * await workflow.end();
 * ```
 */
export class CustomTracking {
  /**
   * Tracks a custom event.
   *
   * Creates a zero-length span with the event name and attributes.
   *
   * @param name - Event name (becomes span name).
   * @param attributes - Optional attributes to attach to the event.
   */
  async trackCustomEvent(name: string, attributes?: Attributes): Promise<void> {
    return Native.customTrackEvent(name, attributes ?? {});
  }

  /**
   * Starts a workflow span for duration measurement.
   *
   * Returns a handle to end the workflow later. The span duration
   * measures time between start and end.
   *
   * @param name - Workflow name (becomes span name and `workflow.name` attribute).
   * @returns Handle to end the workflow.
   */
  async startWorkflow(name: string): Promise<WorkflowHandle> {
    const handle = await Native.customStartWorkflow(name);
    return new WorkflowHandle(handle);
  }

  /**
   * Reports a caught error or exception as a first-class RUM error.
   *
   * Captures the error type, message, and stacktrace at the call site and
   * emits a `component=error` span natively with OTel `exception.*`
   * attributes. The raw (unsymbolicated) stack is always sent as
   * `exception.stacktrace`.
   *
   * This method is side-effect only: it never throws back into the caller,
   * never consumes or alters the caught error, and always resolves (it does
   * not reject). The app keeps full control to log, show UI, retry, or
   * re-throw. Before `install()` or on reporting failure it resolves silently
   * and logs a debug warning.
   *
   * @example Caught error
   * ```typescript
   * try {
   *   doRiskyThing();
   * } catch (e) {
   *   SplunkRum.instance.customTracking.trackError(e);
   * }
   * ```
   *
   * @example Message with attributes
   * ```typescript
   * await SplunkRum.instance.customTracking.trackError('Checkout failed', {
   *   attributes: { 'screen.name': 'Cart' },
   * });
   * ```
   *
   * @param error - The caught `Error`.
   * @param options - Optional reporting options.
   */
  async trackError(error: Error, options?: ReportErrorOptions): Promise<void>;
  /**
   * Reports an error described by a message string.
   *
   * @param message - The error message.
   * @param options - Optional reporting options.
   */
  async trackError(
    message: string,
    options?: ReportErrorOptions
  ): Promise<void>;
  async trackError(
    errorOrMessage: Error | string,
    options?: ReportErrorOptions
  ): Promise<void> {
    try {
      const normalized = normalizeError(errorOrMessage);

      const source = options?.source ?? ErrorSource.Custom;
      const handled = options?.handled ?? true;
      const timestampMs = options?.timestampMs ?? Date.now();
      const attributes = options?.attributes ?? {};

      // `framesJson` / `sourceMapIdsJson` are reserved for later, full automatic-capture phases.
      //  The backend currently symbolicates from the raw `exception.stacktrace`.
      await Native.reportError(
        normalized.type,
        normalized.message,
        normalized.stack,
        attributes,
        '',
        source,
        handled,
        timestampMs,
        ''
      );
    } catch (e) {
      console.warn(
        '[SplunkRum] trackError failed to report:',
        e instanceof Error ? e.message : String(e)
      );
    }
  }
}
