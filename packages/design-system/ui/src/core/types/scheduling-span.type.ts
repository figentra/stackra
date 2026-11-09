/**
 * Stackra file contract:
 * Purpose: `SchedulingSpan`, a stretch of a SchedulingBoard row in columns, for shading: outside working time, or
 *          the past.
 * Boundary: types only; internal to the web and native SchedulingBoard.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */

/** A stretch of a row. */
export interface SchedulingSpan {
  /** Where it starts, in columns from the first. */
  readonly offset: number;
  /** How many columns it spans. */
  readonly length: number;
}
