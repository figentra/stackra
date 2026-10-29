/**
 * Stackra file contract:
 * Purpose: `otlpTracesBody(spans, serviceName)`, the OTLP/JSON `ExportTraceServiceRequest` for a batch of ended spans:
 *          one resource, one scope (`@stackra/logger`), and per span its ids, parent, kind, times in nanoseconds,
 *          attributes, status and, for a failed span, an `exception` event with the error's type.
 * Boundary: pure. Ids are hex strings, as OTLP/JSON requires; attributes are ids and codes only (ADR 0147 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1); ADR 0147 (decision 3); the OTLP/JSON encoding.
 */
import { otlpResource } from "#core/functions/otlp-resource.function";
import { otlpValue } from "#core/functions/otlp-value.function";
import type { FinishedSpan } from "#core/types/finished-span.type";

/** OTLP `SpanKind` numbers. */
const KIND = { internal: 1, server: 2 } as const;

/** Unix milliseconds as the OTLP nanosecond string. */
const nanos = (ms: number): string => `${BigInt(Math.round(ms)) * 1_000_000n}`;

/**
 * The export request of `spans`.
 *
 * @example
 * await fetch(`${endpoint}/v1/traces`, { method: "POST", body: JSON.stringify(otlpTracesBody(batch, "orders")) });
 */
export function otlpTracesBody(spans: readonly FinishedSpan[], serviceName: string): object {
  return {
    resourceSpans: [
      {
        resource: otlpResource(serviceName),
        scopeSpans: [
          {
            scope: { name: "@stackra/logger" },
            spans: spans.map((span) => ({
              traceId: span.context.traceId,
              spanId: span.context.spanId,
              ...(span.parentSpanId === undefined ? {} : { parentSpanId: span.parentSpanId }),
              name: span.name,
              kind: KIND[span.kind],
              startTimeUnixNano: nanos(span.startMs),
              endTimeUnixNano: nanos(span.endMs),
              attributes: Object.entries(span.attributes).map(([key, value]) => ({
                key,
                value: otlpValue(value),
              })),
              events:
                span.error === undefined
                  ? []
                  : [
                      {
                        name: "exception",
                        timeUnixNano: nanos(span.endMs),
                        attributes: [{ key: "exception.type", value: { stringValue: span.error } }],
                      },
                    ],
              status: span.error === undefined ? { code: 0 } : { code: 2, message: span.error },
            })),
          },
        ],
      },
    ],
  };
}
