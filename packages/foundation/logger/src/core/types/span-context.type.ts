/**
 * Stackra file contract:
 * Purpose: `SpanContext`, the W3C trace context of one span: its trace id, its span id and whether it is sampled.
 * Boundary: a type only. Ids are lower-case hex (32 and 16 characters), as `traceparent` and OTLP/JSON write them.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1); W3C Trace Context.
 */

/** A span's place in its trace. */
export interface SpanContext {
  /** 32 hex characters, never all zero. */
  readonly traceId: string;

  /** 16 hex characters, never all zero. */
  readonly spanId: string;

  /** The `sampled` trace flag: whether the trace is recorded. */
  readonly sampled: boolean;
}
