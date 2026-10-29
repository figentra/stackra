/**
 * Stackra file contract:
 * Purpose: `formatTraceparent(context)`, the W3C `traceparent` header (version `00`) of a span, for an outbound call.
 * Boundary: pure; it writes the ids as given (`SpanContext` holds them as lower-case hex).
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1); W3C Trace Context (traceparent header).
 */
import type { SpanContext } from "#core/types/span-context.type";

/**
 * Writes the header.
 *
 * @example
 * formatTraceparent({ traceId: "4bf9...4736", spanId: "00f0...02b7", sampled: true }); // "00-4bf9...4736-00f0...02b7-01"
 */
export function formatTraceparent(context: SpanContext): string {
  return `00-${context.traceId}-${context.spanId}-${context.sampled ? "01" : "00"}`;
}
