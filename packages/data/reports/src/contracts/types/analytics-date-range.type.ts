/**
 * Stackra file contract:
 * Purpose: `AnalyticsDateRange`, the calendar days a funnel, retention or cohort query reads: `from` and `to` as
 *          `YYYY-MM-DD`, both included.
 * Boundary: a type only; a driver refuses a malformed day, `from` after `to`, or a span over two years.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0294 (decision 15: the leaf entry).
 */

/** The days a product analytics query covers. */
export interface AnalyticsDateRange {
  /** The first day, `YYYY-MM-DD`. */
  readonly from: string;

  /** The last day, `YYYY-MM-DD`, included. */
  readonly to: string;
}
