/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/storage, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `Storage` is exported from `./contracts` only (registry A3,
 *           ADR 0294 decision 15). The area implementation, the shared driver base and the key lookup stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { MemoryStorageDriver } from "#core/drivers/memory-storage.driver";
export { OfflineStore } from "#core/enums/offline-store.enum";
export { StorageArea } from "#core/enums/storage-area.enum";
export { registerStorageKeys } from "#core/functions/register-storage-keys.function";
export type { StorageKey } from "#core/types/storage-key.type";
