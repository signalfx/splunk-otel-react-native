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
}
