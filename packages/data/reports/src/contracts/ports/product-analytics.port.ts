/**
 * Stackra file contract:
 * Purpose: the `ProductAnalytics` port: funnels, retention tables and behavioural cohorts over product analytics
 *          events, computed by an analytics store and returned as counts of people. Which store is configuration
 *          (`ReportsConfig.productAnalytics`), never code.
 * Boundary: an abstract class that is its own token, keyed `reports.ProductAnalytics`. It speaks only the types of this
 *           leaf entry. The `posthog` driver ships in `@stackra/reports/node` (stackra-425); a driver over Stackra's own
 *           event store follows the raw event store (stackra-416), and Mixpanel, Amplitude and GA4 are Pro (ADR 0461).
 *           The funnel, retention and cohort report kinds and widgets that call it are stackra-418. A driver isolates
 *           the call's scope itself (it filters to the scope's events and refuses a call with none) and never returns
 *           who a person is.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28: funnels, retention and cohorts are built in Stackra
 *                     behind a port, PostHog the first driver); ADR 0190 (decision 2); ADR 0142 (drivers behind a
 *                     port); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { CohortQuery } from "#contracts/types/cohort-query.type";
import type { CohortResult } from "#contracts/types/cohort-result.type";
import type { FunnelQuery } from "#contracts/types/funnel-query.type";
import type { FunnelResult } from "#contracts/types/funnel-result.type";
import type { RetentionQuery } from "#contracts/types/retention-query.type";
import type { RetentionResult } from "#contracts/types/retention-result.type";

/**
 * Computes funnels, retention and cohorts for the current caller's scope.
 *
 * @example
 * const funnel = await analytics.funnel({ steps: [{ event: "cart_viewed" }, { event: "order_placed" }], range: { from: "2026-10-01", to: "2026-10-28" } });
 */
export abstract class ProductAnalytics extends Port {
  /** Type-only port key, so `DriverName<ProductAnalytics>` narrows to this port's drivers. */
  declare readonly "~key": "reports.ProductAnalytics";

  /**
   * The people who reached each step of `query` in order within its window.
   *
   * @throws a validation refusal for fewer than two or more than twenty steps, a bad range or window, or a bad match.
   */
  abstract funnel(query: FunnelQuery): Promise<FunnelResult>;

  /**
   * The retention table of `query`.
   *
   * @throws a validation refusal for a bad range, period or interval count.
   */
  abstract retention(query: RetentionQuery): Promise<RetentionResult>;

  /**
   * The distinct people matching `query` in each period.
   *
   * @throws a validation refusal for a bad range, period or match.
   */
  abstract cohort(query: CohortQuery): Promise<CohortResult>;
}
