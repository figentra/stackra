/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/entitlements (the `EntitlementSource`,
 *          `EntitlementUsage`, `PlanSnapshots` and `SeatLedger` ports and the types they name) until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package (ADR
 *           0294 decision 15). `EntitlementSource` names `EntitlementRef`, the structural form of an entitlement
 *           class, so it no longer needs the core base.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { EntitlementSource } from "#contracts/ports/entitlement-source.port";
export { EntitlementUsage } from "#contracts/ports/entitlement-usage.port";
export { PlanSnapshots } from "#contracts/ports/plan-snapshots.port";
export { SeatLedger } from "#contracts/ports/seat-ledger.port";
export type { EntitlementRef } from "#contracts/types/entitlement-ref.type";
export type { LimitGrant } from "#contracts/types/limit-grant.type";
export type { PlanSnapshot } from "#contracts/types/plan-snapshot.type";
export type { SeatAssignment } from "#contracts/types/seat-assignment.type";
