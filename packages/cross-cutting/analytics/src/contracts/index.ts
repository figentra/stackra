/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/analytics, the leaf entry with the `AnalyticsDriver`
 *          port, its `AnalyticsDelivery` and the delivery's `AnalyticsContext`, until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. All are
 *           exported here only, never from `.` (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
export type { AnalyticsContext } from "#contracts/types/analytics-context.type";
export type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
