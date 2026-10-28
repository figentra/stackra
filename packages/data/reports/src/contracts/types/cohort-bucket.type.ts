/**
 * Stackra file contract:
 * Purpose: `CohortBucket`, one period of a sized cohort: its first day and the distinct people in it.
 * Boundary: a type only; counts of people, never who they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0294 (decision 15: the leaf entry).
 */

/** One period of a sized cohort. */
export interface CohortBucket {
  /** The period's first day, `YYYY-MM-DD`. */
  readonly start: string;

  /** Distinct people who matched in the period. */
  readonly people: number;
}
