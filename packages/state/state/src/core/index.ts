/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/state, which has several public files, until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The shipped schema is re-exported under the generated name
 *           (`StateConfig$`) a host's generated schema extends. `registerStores` is the call the generated wiring
 *           makes. The bookkeeping, hydration and `StateOptions` stay internal; signals and hooks are `./react`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { StateConfig } from "#config/state.config";
export { Store } from "#core/bases/store.base";
export { STATE_CONFIG_SCHEMA as StateConfig$ } from "#core/constants/state-config-schema.constant";
export { registerStores } from "#core/functions/register-stores.function";
export type { StoreClass } from "#core/types/store-class.type";
export type { StoreOptions } from "#core/types/store-options.type";
export type { StorePatch } from "#core/types/store-patch.type";
export type { StoreStorage } from "#core/types/store-storage.type";
export type { StoreStorageArea } from "#core/types/store-storage-area.type";
