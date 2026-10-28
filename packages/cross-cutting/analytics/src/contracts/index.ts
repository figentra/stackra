/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/analytics, the leaf entry with the `AnalyticsDriver`,
 *          `AnalyticsDriverLookup`, `AnalyticsIdentity` and `AnalyticsOfflineQueue` ports, the `AnalyticsDelivery`, its kind and `AnalyticsContext`, and the kept
 *          `AnalyticsIdentityRecord`, until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. All are
 *           exported here only, never from `.` (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { AnalyticsDeliveryKind } from "#contracts/enums/analytics-delivery-kind.enum";
export { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
export { AnalyticsDriverLookup } from "#contracts/ports/analytics-driver-lookup.port";
export { AnalyticsIdentity } from "#contracts/ports/analytics-identity.port";
export { AnalyticsOfflineQueue } from "#contracts/ports/analytics-offline-queue.port";
export type { AnalyticsContext } from "#contracts/types/analytics-context.type";
export type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
export type { AnalyticsIdentityRecord } from "#contracts/types/analytics-identity-record.type";
