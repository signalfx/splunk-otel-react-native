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
type JsEngine = 'hermes' | 'unknown';

let enabled = false;

export function setJsErrorDiagnosticLogging(enabledValue: boolean): void {
  enabled = enabledValue;
}

function detectJsEngine(): JsEngine {
  const runtime = globalThis as { HermesInternal?: unknown };
  return runtime.HermesInternal != null ? 'hermes' : 'unknown';
}

function stringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '"<undefined>"';
  } catch {
    return '"<unable to serialize diagnostic value>"';
  }
}

/**
 * Emits the raw capture and bridge stages so release/Hermes tests can compare
 * them without ambiguity.
 *
 * Stack traces may contain customer data. This logger is enabled only through
 * the agent's explicit debug-logging configuration.
 */
export function logJsErrorPayloadDiagnostics(input: {
  message: string;
  attributes: Attributes;
  stack?: string;
}): void {
  if (!enabled) {
    return;
  }

  const { message, attributes, stack } = input;
  console.log(
    '[SplunkRum][JsErrorDiagnostic][summary]',
    stringify({
      engine: detectJsEngine(),
      hasStack: stack != null,
      stackLength: stack?.length ?? 0,
    })
  );
  console.log(
    '[SplunkRum][JsErrorDiagnostic][raw-stack]',
    stack ?? '<no JavaScript stack>'
  );
  console.log(
    '[SplunkRum][JsErrorDiagnostic][bridge-payload]',
    stringify({ message, stack: stack ?? null, attributes })
  );
}
