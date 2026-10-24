/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/settings (the `SettingValueStore` port and its types)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package (ADR
 *           0294 decision 15). `ScopeRef` is @stackra/contracts' and is never re-exported here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { SettingValueStore } from "#contracts/ports/setting-value-store.port";
export type { SettingLayer } from "#contracts/types/setting-layer.type";
export type { SettingTarget } from "#contracts/types/setting-target.type";
export type { SettingValue } from "#contracts/types/setting-value.type";
