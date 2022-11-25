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

import * as api from '@opentelemetry/api';
import type { ReadableSpan, TimedEvent } from '@opentelemetry/sdk-trace-base';
import { hrTimeToMicroseconds } from '@opentelemetry/core';
import type { Resource } from '@opentelemetry/resources';

/**
 * Zipkin Span
 * @see https://github.com/openzipkin/zipkin-api/blob/master/zipkin2-api.yaml
 */
export interface Span {
  /**
   * Trace identifier, set on all spans within it.
   */
  traceId: string;
  /**
   * The logical operation this span represents in lowercase (e.g. rpc method).
   * Leave absent if unknown.
   */
  name: string;
  /**
   * The parent span ID or absent if this the root span in a trace.
   */
  parentId?: string;
  /**
   * Unique 64bit identifier for this operation within the trace.
   */
  id: string;
  /**
   * When present, kind clarifies timestamp, duration and remoteEndpoint.
   * When absent, the span is local or incomplete.
   */
  kind?: ZipkinSpanKind;
  /**
   * Epoch microseconds of the start of this span, possibly absent if
   * incomplete.
   */
  timestamp: number;
  /**
   * Duration in microseconds of the critical path, if known.
   */
  duration: number;
  /**
   * True is a request to store this span even if it overrides sampling policy.
   * This is true when the `X-B3-Flags` header has a value of 1.
   */
  debug?: boolean;
  /**
   * True if we are contributing to a span started by another tracer (ex on a
   * different host).
   */
  shared?: boolean;
  /**
   * The host that recorded this span, primarily for query by service name.
   */
  localEndpoint: Endpoint;
  /**
   * Associates events that explain latency with the time they happened.
   */
  annotations?: Annotation[];
  /**
   * Tags give your span context for search, viewing and analysis.
   */
  tags: Tags;
  /**
   * TODO: `remoteEndpoint`, do we need to support it?
   * When an RPC (or messaging) span, indicates the other side of the
   * connection.
   */
}

/**
 * Associates an event that explains latency with a timestamp.
 * Unlike log statements, annotations are often codes. Ex. "ws" for WireSend
 * Zipkin v1 core annotations such as "cs" and "sr" have been replaced with
 * Span.Kind, which interprets timestamp and duration.
 */
export interface Annotation {
  /**
   * Epoch microseconds of this event.
   * For example, 1502787600000000 corresponds to 2017-08-15 09:00 UTC
   */
  timestamp: number;
  /**
   * Usually a short tag indicating an event, like "error"
   * While possible to add larger data, such as garbage collection details, low
   * cardinality event names both keep the size of spans down and also are easy
   * to search against.
   */
  value: string;
}

/**
 * The network context of a node in the service graph.
 */
export interface Endpoint {
  /**
   * Lower-case label of this node in the service graph, such as "favstar".
   * Leave absent if unknown.
   * This is a primary label for trace lookup and aggregation, so it should be
   * intuitive and consistent. Many use a name from service discovery.
   */
  serviceName?: string;
  /**
   * The text representation of the primary IPv4 address associated with this
   * connection. Ex. 192.168.99.100 Absent if unknown.
   */
  ipv4?: string;
  /**
   * The text representation of the primary IPv6 address associated with a
   * connection. Ex. 2001:db8::c001 Absent if unknown.
   * Prefer using the ipv4 field for mapped addresses.
   */
  port?: number;
}

/**
 * Adds context to a span, for search, viewing and analysis.
 * For example, a key "your_app.version" would let you lookup traces by version.
 * A tag "sql.query" isn't searchable, but it can help in debugging when viewing
 * a trace.
 */
export interface Tags {
  [tagKey: string]: unknown;
}

/**
 * When present, kind clarifies timestamp, duration and remoteEndpoint. When
 * absent, the span is local or incomplete. Unlike client and server, there
 * is no direct critical path latency relationship between producer and
 * consumer spans.
 * `CLIENT`
 *   timestamp is the moment a request was sent to the server.
 *   duration is the delay until a response or an error was received.
 *   remoteEndpoint is the server.
 * `SERVER`
 *   timestamp is the moment a client request was received.
 *   duration is the delay until a response was sent or an error.
 *   remoteEndpoint is the client.
 * `PRODUCER`
 *   timestamp is the moment a message was sent to a destination.
 *   duration is the delay sending the message, such as batching.
 *   remoteEndpoint is the broker.
 * `CONSUMER`
 *   timestamp is the moment a message was received from an origin.
 *   duration is the delay consuming the message, such as from backlog.
 *   remoteEndpoint - Represents the broker. Leave serviceName absent if unknown.
 */
export enum ZipkinSpanKind {
  CLIENT = 'CLIENT',
  SERVER = 'SERVER',
  CONSUMER = 'CONSUMER',
  PRODUCER = 'PRODUCER',
}

const ZIPKIN_SPAN_KIND_MAPPING = {
  [api.SpanKind.CLIENT]: ZipkinSpanKind.CLIENT,
  [api.SpanKind.SERVER]: ZipkinSpanKind.SERVER,
  [api.SpanKind.CONSUMER]: ZipkinSpanKind.CONSUMER,
  [api.SpanKind.PRODUCER]: ZipkinSpanKind.PRODUCER,
  // When absent, the span is local.
  [api.SpanKind.INTERNAL]: undefined,
};

export const defaultStatusCodeTagName = 'otel.status_code';
export const defaultStatusErrorTagName = 'error';

/**
 * Translate OpenTelemetry ReadableSpan to ZipkinSpan format
 * @param span Span to be translated
 */
export function toZipkinSpan(span: ReadableSpan, serviceName: string): Span {
  const zipkinSpan: Span = {
    traceId: span.spanContext().traceId,
    parentId: span.parentSpanId,
    name: span.name,
    id: span.spanContext().spanId,
    kind: ZIPKIN_SPAN_KIND_MAPPING[span.kind],
    timestamp: hrTimeToMicroseconds(span.startTime),
    duration: hrTimeToMicroseconds(span.duration),
    localEndpoint: { serviceName },
    tags: _toZipkinTags(span.attributes, span.status, span.resource),
    annotations: span.events.length
      ? _toZipkinAnnotations(span.events)
      : undefined,
  };

  return zipkinSpan;
}

/** Converts OpenTelemetry SpanAttributes and SpanStatus to Zipkin Tags format. */
export function _toZipkinTags(
  attributes: api.Attributes,
  status: api.SpanStatus,
  resource: Resource
): Tags {
  const tags: { [key: string]: string } = {};
  for (const key of Object.keys(attributes)) {
    tags[key] = String(attributes[key]);
  }
  if (status.code !== api.SpanStatusCode.UNSET) {
    tags['otel.status_code'] = String(api.SpanStatusCode[status.code]);
  }
  if (status.code === api.SpanStatusCode.ERROR && status.message) {
    tags.error = status.message;
  }

  Object.keys(resource.attributes).forEach(
    (name) => (tags[name] = String(resource.attributes[name]))
  );

  return tags;
}

/**
 * Converts OpenTelemetry Events to Zipkin Annotations format.
 */
export function _toZipkinAnnotations(events: TimedEvent[]): Annotation[] {
  return events.map((event) => ({
    timestamp: hrTimeToMicroseconds(event.time),
    value: event.name,
  }));
}
