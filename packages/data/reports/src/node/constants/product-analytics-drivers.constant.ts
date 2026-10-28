/**
 * Stackra file contract:
 * Purpose: `PRODUCT_ANALYTICS_DRIVERS`, the driver names of the `ProductAnalytics` port that
 *          `ReportsConfig.productAnalytics` may select: `posthog` (this package's `./node`). A driver over Stackra's own
 *          event store joins with stackra-416, and the Pro Mixpanel, Amplitude and GA4 drivers with their package (ADR
 *          0461), never before, so a name always has a driver behind it.
 * Boundary: internal data; it types `ReportsOptions.productAnalytics` through the `DriverRegistry` entry and checks it
 *           in the shipped schema. The names must equal the ones gen writes for this port in a host's wiring.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0294 (decisions 4 and 19); ADR 0263 (decision
 *                     9).
 */

/** The selectable product analytics drivers. */
export const PRODUCT_ANALYTICS_DRIVERS = Object.freeze(["posthog"] as const);
