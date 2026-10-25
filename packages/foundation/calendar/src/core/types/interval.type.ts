/**
 * Stackra file contract:
 * Purpose: `Interval`, a half-open span of time `[start, end)` between two instants: open working hours, a busy block
 *          or a found slot.
 * Boundary: a type only. Both ends are ISO 8601 instants with an offset; results are always in UTC (`Z`).
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decisions 5 and 7).
 */

/** A span of time, start included, end excluded. */
export interface Interval {
  /** The first instant, ISO 8601. */
  readonly start: string;

  /** The instant just after the span, ISO 8601. */
  readonly end: string;
}
