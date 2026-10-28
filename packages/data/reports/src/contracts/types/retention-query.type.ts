/**
 * Stackra file contract:
 * Purpose: `RetentionQuery`, a retention table: people who did the start event in a period, and how many of them did
 *          the return event in each following period.
 * Boundary: a type only; `ProductAnalytics.retention` takes it. Cohorts start on each period of the range.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0294 (decision 15: the leaf entry).
 */
import type { RetentionPeriod } from "#contracts/enums/retention-period.enum";
import type { AnalyticsDateRange } from "#contracts/types/analytics-date-range.type";

/** One retention table to compute. */
export interface RetentionQuery {
  /** The event that puts a person in a cohort (`signed_up`). */
  readonly startEvent: string;

  /** The event that counts as coming back (`order_placed`). */
  readonly returnEvent: string;

  /** The cohort and return period. */
  readonly period: RetentionPeriod;

  /** Periods followed after the start, 1 to 52. */
  readonly intervals: number;

  /** The days cohorts may start on. */
  readonly range: AnalyticsDateRange;

  /** True to start a cohort on every start event, not only a person's first; false when absent. */
  readonly recurring?: boolean;
}
