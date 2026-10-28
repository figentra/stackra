/**
 * Stackra file contract:
 * Purpose: `ProductAnalyticsCall`, one `ProductAnalytics` call as the driver's shared steps read it: which question
 *          (`funnel`, `retention` or `cohort`) and its query.
 * Boundary: internal; a type only. The check, the PostHog query builder and the PostHog reply reader switch on `kind`,
 *           so a new question is one more member here.
 * Runtime: node
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28).
 */
import type { CohortQuery } from "#contracts/types/cohort-query.type";
import type { FunnelQuery } from "#contracts/types/funnel-query.type";
import type { RetentionQuery } from "#contracts/types/retention-query.type";

/** One product analytics call. */
export type ProductAnalyticsCall =
  | { readonly kind: "funnel"; readonly query: FunnelQuery }
  | { readonly kind: "retention"; readonly query: RetentionQuery }
  | { readonly kind: "cohort"; readonly query: CohortQuery };
