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

import { CustomTracking, ErrorSource } from '../api/CustomTracking';

const mockReportError = jest.fn().mockResolvedValue(undefined);
const mockCustomTrackEvent = jest.fn().mockResolvedValue(undefined);
const mockCustomStartWorkflow = jest.fn().mockResolvedValue(7);
const mockCustomEndWorkflow = jest.fn().mockResolvedValue(undefined);

jest.mock('../sdk/SplunkNativeBridge', () => ({
  SplunkNativeBridge: {
    reportError: (...args: unknown[]) => mockReportError(...args),
    customTrackEvent: (...args: unknown[]) => mockCustomTrackEvent(...args),
    customStartWorkflow: (...args: unknown[]) => mockCustomStartWorkflow(...args),
    customEndWorkflow: (...args: unknown[]) => mockCustomEndWorkflow(...args),
  },
}));

// Bridge argument positions for `reportError`.
const ARG = {
  type: 0,
  message: 1,
  stacktrace: 2,
  attributes: 3,
  framesJson: 4,
  source: 5,
  handled: 6,
  sourceMapIdsJson: 7,
} as const;

describe('CustomTracking.trackError', () => {
  let tracking: CustomTracking;

  beforeEach(() => {
    tracking = new CustomTracking();
    mockReportError.mockClear();
    mockReportError.mockResolvedValue(undefined);
  });

  it('reports an Error with default options', async () => {
    const error = new TypeError('x is not a function');

    await tracking.trackError(error);

    expect(mockReportError).toHaveBeenCalledTimes(1);
    const args = mockReportError.mock.calls[0];
    expect(args[ARG.type]).toBe('TypeError');
    expect(args[ARG.message]).toBe('x is not a function');
    expect(typeof args[ARG.stacktrace]).toBe('string');
    expect(args[ARG.stacktrace].length).toBeGreaterThan(0);
    expect(args[ARG.attributes]).toEqual({});
    expect(args[ARG.framesJson]).toBe('');
    expect(args[ARG.source]).toBe(ErrorSource.Custom);
    expect(args[ARG.handled]).toBe(true);
    expect(args[ARG.sourceMapIdsJson]).toBe('');
  });

  it('reports a message string with no stacktrace', async () => {
    await tracking.trackError('manual report');

    const args = mockReportError.mock.calls[0];
    expect(args[ARG.type]).toBe('Error');
    expect(args[ARG.message]).toBe('manual report');
    expect(args[ARG.stacktrace]).toBe('');
  });

  it('forwards options (attributes, source, handled)', async () => {
    await tracking.trackError('checkout failed', {
      attributes: { 'screen.name': 'Cart', retries: 2 },
      source: ErrorSource.Source,
      handled: false,
    });

    const args = mockReportError.mock.calls[0];
    expect(args[ARG.attributes]).toEqual({ 'screen.name': 'Cart', retries: 2 });
    expect(args[ARG.source]).toBe(ErrorSource.Source);
    expect(args[ARG.handled]).toBe(false);
  });

  it('resolves (never rejects) when the bridge rejects', async () => {
    mockReportError.mockRejectedValue(new Error('bridge unavailable'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(tracking.trackError('boom')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it('resolves (never throws) when the bridge method throws synchronously', async () => {
    mockReportError.mockImplementation(() => {
      throw new Error('not linked');
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(tracking.trackError('boom')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it('does not consume or alter the caught error', async () => {
    const error = new Error('original');

    await tracking.trackError(error);

    expect(error.message).toBe('original');
    expect(error).toBeInstanceOf(Error);
  });
});
