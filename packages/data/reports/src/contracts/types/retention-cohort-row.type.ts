/**
 * Stackra file contract:
 * Purpose: `RetentionCohortRow`, one cohort row of a retention table: its first day, its size and the people retained
 *          in each period after the start.
 * Boundary: a type only; counts of people, never who they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0294 (decision 15: the leaf entry).
 */

/** One cohort row of a retention table. */
export interface RetentionCohortRow {
  /** The cohort's first day, `YYYY-MM-DD`. */
  readonly start: string;

  /** People in the cohort (period 0). */
  readonly size: number;

  /** People retained in period 0, 1, 2 ... in order; the first equals `size`. */
  readonly retained: readonly number[];
}
