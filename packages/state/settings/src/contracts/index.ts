/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/settings (the `SettingValueStore`,
 *          `SettingFloorSource`, `SettingRevisionStore` and `Promotable` ports, their enums and types, and the shipped
 *          `PromotionDiff$`, STA-1284) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package (ADR
 *           0294 decision 15). `ScopeRef` is @stackra/contracts' and is never re-exported here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { PROMOTION_DIFF_SCHEMA as PromotionDiff$ } from "#contracts/constants/promotion-diff-schema.constant";
export { SettingEnvironment } from "#contracts/enums/setting-environment.enum";
export { SettingRevisionStatus } from "#contracts/enums/setting-revision-status.enum";
export { SettingSource } from "#contracts/enums/setting-source.enum";
export { Promotable } from "#contracts/ports/promotable.port";
export { SettingEntitlementSource } from "#contracts/ports/setting-entitlement-source.port";
export { SettingFloorSource } from "#contracts/ports/setting-floor-source.port";
export { SettingRevisionStore } from "#contracts/ports/setting-revision-store.port";
export { SettingValueStore } from "#contracts/ports/setting-value-store.port";
export type { PromotionDiff } from "#contracts/types/promotion-diff.type";
export type { SettingFloor } from "#contracts/types/setting-floor.type";
export type { SettingLayer } from "#contracts/types/setting-layer.type";
export type { SettingRevision } from "#contracts/types/setting-revision.type";
export type { SettingTarget } from "#contracts/types/setting-target.type";
export type { SettingValue } from "#contracts/types/setting-value.type";
export type { SettingsPack } from "#contracts/types/settings-pack.type";
