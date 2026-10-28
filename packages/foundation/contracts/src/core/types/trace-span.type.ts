/**
 * Stackra file contract:
 * Purpose: `TraceSpan`, the span a `Tracer` hands the work it traces: the work adds attributes it learns while it runs
 *          (an outcome, a decision) and records the error it caught.
 * Boundary: a type only; the span ends when the traced work settles, so it has no `end`. Attributes follow
 *           `TraceAttributes`: ids and codes, never values.
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (decision 3); ADR 0184 (decision 1: OpenTelemetry).
 */
import type { TraceAttributes } from "#core/types/trace-attributes.type";

/** A running span. */
export interface TraceSpan {
  /** Adds or replaces attributes on the span. */
  set: (attributes: TraceAttributes) => void;

  /** Marks the span failed with `error`'s type and code; the span still ends when its work settles. */
  fail: (error: unknown) => void;
}
