/**
 * Stackra file contract:
 * Purpose: `CohortQuery`, a behavioural cohort over time: the distinct people who did a matching event in each
 *          period of a date range.
 * Boundary: a type only; `ProductAnalytics.cohort` takes it. One criterion; a cohort of several criteria and saved
 *           cohorts are not here yet.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0294 (decision 15: the leaf entry).
 */
import type { RetentionPeriod } from "#contracts/enums/retention-period.enum";
import type { AnalyticsDateRange } from "#contracts/types/analytics-date-range.type";
import type { AnalyticsEventMatch } from "#contracts/types/analytics-event-match.type";

/** One cohort to size. */
export interface CohortQuery {
  /** The events that put a person in the cohort. */
  readonly match: AnalyticsEventMatch;

  /** The period people are counted per. */
  readonly period: RetentionPeriod;

  /** The days counted. */
  readonly range: AnalyticsDateRange;
}
