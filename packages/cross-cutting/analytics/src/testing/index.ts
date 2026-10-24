/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/analytics (`fakeAnalytics`, `AnalyticsFake` and the
 *          `memory` driver) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports this package's other entries only; no other package's
 *           `./testing` (ADR 0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { AnalyticsFake } from "#testing/analytics.fake";
export { MemoryAnalyticsDriver } from "#testing/drivers/memory-analytics.driver";
export { fakeAnalytics } from "#testing/functions/fake-analytics.function";
