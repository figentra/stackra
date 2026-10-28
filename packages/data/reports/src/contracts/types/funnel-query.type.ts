/**
 * Stackra file contract:
 * Purpose: `FunnelQuery`, an ordered funnel: two to twenty steps a person completes in order within a conversion
 *          window, over a date range.
 * Boundary: a type only; `ProductAnalytics.funnel` takes it. People are counted per the store's person identity; no
 *           person is returned.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0294 (decision 15: the leaf entry).
 */
import type { AnalyticsDateRange } from "#contracts/types/analytics-date-range.type";
import type { AnalyticsEventMatch } from "#contracts/types/analytics-event-match.type";

/** One funnel to compute. */
export interface FunnelQuery {
  /** The steps in order; two to twenty. */
  readonly steps: readonly AnalyticsEventMatch[];

  /** The days the first step may fall on. */
  readonly range: AnalyticsDateRange;

  /** Days a person has from the first step to the last, 1 to 90; 14 when absent. */
  readonly windowDays?: number;
}
