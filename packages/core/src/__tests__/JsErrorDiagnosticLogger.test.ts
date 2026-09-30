/*
 * Copyright 2025 Splunk Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

import {
  logJsErrorPayloadDiagnostics,
  setJsErrorDiagnosticLogging,
} from '../instrumentation/JsErrorDiagnosticLogger';

type RuntimeWithHermes = typeof globalThis & { HermesInternal?: unknown };

describe('JsErrorDiagnosticLogger', () => {
  let consoleLog: jest.SpyInstance;

  beforeEach(() => {
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    setJsErrorDiagnosticLogging(false);
    delete (globalThis as RuntimeWithHermes).HermesInternal;
  });

  afterEach(() => {
    setJsErrorDiagnosticLogging(false);
    delete (globalThis as RuntimeWithHermes).HermesInternal;
    consoleLog.mockRestore();
  });

  it('does not log stack or payload data when debug logging is disabled', () => {
    logJsErrorPayloadDiagnostics({
      message: 'hidden',
      attributes: { 'error.layer': 'javascript' },
    });

    expect(consoleLog).not.toHaveBeenCalled();
  });

  it('logs only raw capture and bridge stages', () => {
    (globalThis as RuntimeWithHermes).HermesInternal = {};
    setJsErrorDiagnosticLogging(true);
    const stack = 'p@1:132161';

    logJsErrorPayloadDiagnostics({
      message: 'release failure',
      attributes: {
        'error.layer': 'javascript',
        'exception.type': 'Error',
        'exception.message': 'release failure',
      },
      stack,
    });

    expect(consoleLog).toHaveBeenCalledTimes(3);
    expect(consoleLog.mock.calls[0]).toEqual([
      '[SplunkRum][JsErrorDiagnostic][summary]',
      '{"engine":"hermes","hasStack":true,"stackLength":10}',
    ]);
    expect(consoleLog.mock.calls[1]).toEqual([
      '[SplunkRum][JsErrorDiagnostic][raw-stack]',
      stack,
    ]);
    expect(consoleLog.mock.calls[2]?.[0]).toBe(
      '[SplunkRum][JsErrorDiagnostic][bridge-payload]'
    );
    expect(consoleLog.mock.calls[2]?.[1]).toContain('"stack":"p@1:132161"');
    expect(consoleLog.mock.calls[2]?.[1]).not.toContain(
      'exception.stacktrace'
    );
  });
});
