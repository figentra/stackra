/**
 * Stackra file contract:
 * Purpose: `parseTraceparent(header)`, the span context a W3C `traceparent` header names, so a service continues its
 *          caller's trace.
 * Boundary: pure; it reads a header from outside, so anything malformed (wrong length, upper-case or non-hex ids, an
 *           all-zero id, version `ff`) gives `undefined` and the caller starts a new trace. A future version is read
 *           by its first four fields, as the specification says.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1); W3C Trace Context (traceparent header).
 */
import type { SpanContext } from "#core/types/span-context.type";

/** `version-traceid-parentid-flags`, with room for what a later version appends. */
const TRACEPARENT = /^([\da-f]{2})-([\da-f]{32})-([\da-f]{16})-([\da-f]{2})(-.*)?$/;

/**
 * Reads the header.
 *
 * @example
 * parseTraceparent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");
 * // { traceId: "4bf92f3577b34da6a3ce929d0e0e4736", spanId: "00f067aa0ba902b7", sampled: true }
 */
export function parseTraceparent(header: string | undefined): SpanContext | undefined {
  const match = TRACEPARENT.exec(header?.trim() ?? "");
  if (match === null) return undefined;
  const [, version, traceId = "", spanId = "", flags = "00", rest] = match;
  if (version === "ff" || (version === "00" && rest !== undefined)) return undefined;
  if (/^0+$/.test(traceId) || /^0+$/.test(spanId)) return undefined;
  return { traceId, spanId, sampled: (Number.parseInt(flags, 16) & 1) === 1 };
}
