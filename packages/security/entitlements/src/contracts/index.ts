/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/entitlements (the `EntitlementSource`,
 *          `EntitlementUsage`, `PlanSnapshots`, `SeatLedger` and `CatalogueVersions` ports, `CatalogueVersionState`
 *          and the types they name, plus `CapLiftFacts` and the limit's `EntitlementFilter`) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package (ADR
 *           0294 decision 15). `EntitlementSource` names `EntitlementRef`, the structural form of an entitlement
 *           class, so it no longer needs the core base; `EntitlementKey` is its by-key form (STA-1225).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { CatalogueVersionState } from "#contracts/enums/catalogue-version-state.enum";
export { CatalogueVersions } from "#contracts/ports/catalogue-versions.port";
export { EntitlementSource } from "#contracts/ports/entitlement-source.port";
export { EntitlementUsage } from "#contracts/ports/entitlement-usage.port";
export { PlanSnapshots } from "#contracts/ports/plan-snapshots.port";
export { SeatLedger } from "#contracts/ports/seat-ledger.port";
export type { CapLiftFacts } from "#contracts/types/cap-lift-facts.type";
export type { CatalogueVersion } from "#contracts/types/catalogue-version.type";
export type { EntitlementFilter } from "#contracts/types/entitlement-filter.type";
export type { EntitlementKey } from "#contracts/types/entitlement-key.type";
export type { EntitlementRef } from "#contracts/types/entitlement-ref.type";
export type { LimitGrant } from "#contracts/types/limit-grant.type";
export type { PlanSnapshot } from "#contracts/types/plan-snapshot.type";
export type { SeatAssignment } from "#contracts/types/seat-assignment.type";
