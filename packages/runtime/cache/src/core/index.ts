/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/cache, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `Cache` and `CacheNamespace` are not here: they are exported
 *           from `./contracts` only (ADR 0294 decision 15; registry conflict A3). The shipped schema is re-exported
 *           under its generated name (`CacheConfig$`). `coversKey` and `storedCache` stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { CacheConfig } from "#config/cache.config";
export { CACHE_CONFIG_SCHEMA as CacheConfig$ } from "#core/constants/cache-config-schema.constant";
export { CacheKey } from "#core/constants/cache-key.constant";
export { MemoryCacheDriver } from "#core/drivers/memory-cache.driver";
export { SharedCacheNamespaceDriver } from "#core/drivers/shared-cache-namespace.driver";
export { StorageCacheDriver } from "#core/drivers/storage-cache.driver";
export { CacheOptions } from "#core/schemas/cache-options.schema";
