/**
 * Stackra file contract:
 * Purpose: `RetentionPeriod`, the period a retention table or a cohort's size is bucketed by: day, week or month.
 * Boundary: an `Enum.of` value plus the type of the same name; a closed set every `ProductAnalytics` driver maps to its
 *           store's own period names. Buckets fall in the store's time zone (the PostHog project's for `posthog`).
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28: funnels, retention and cohorts behind a port); ADR
 *                     0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** How retention and cohort sizes are bucketed. */
export const RetentionPeriod = Enum.of({
  /** One bucket per day. */
  Day: "day",
  /** One bucket per week. */
  Week: "week",
  /** One bucket per calendar month. */
  Month: "month",
});

/** One of the periods above. */
export type RetentionPeriod = Enum.Value<typeof RetentionPeriod>;
