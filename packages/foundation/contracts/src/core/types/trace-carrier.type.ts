/**
 * Stackra file contract:
 * Purpose: `TraceCarrier`, what an inbound call says about its trace: the W3C `traceparent` header it arrived with and
 *          the request id the edge stamped on it (`x-figentra-request-id`).
 * Boundary: a type only, and deliberately mutable: the server app hands one to `Tracer.continueTrace` before its
 *           guards run and fills it once they pass, and the tracer reads it when the call's first span starts. The
 *           request id is an id, never a value (ADR 0147 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1: OpenTelemetry, OTLP everywhere); ADR 0147 (decision 3); W3C Trace Context.
 */

/** The inbound side of one call's trace. */
export interface TraceCarrier {
  /** `00-<trace id>-<parent span id>-<flags>`, as the caller sent it. */
  traceparent?: string;

  /** The edge's request id, set on every span of the call as `requestId`. */
  requestId?: string;
}
