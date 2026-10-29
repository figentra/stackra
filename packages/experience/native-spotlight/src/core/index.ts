/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/native-spotlight (the configuration with its shipped schema,
 *          the visibility rules, the indexer, the memory driver and the record and session types) until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `DeviceSearchIndex` is exported from `./contracts` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { SpotlightConfig } from "#config/spotlight.config";
export { SPOTLIGHT_CONFIG_SCHEMA as SpotlightConfig$ } from "#core/constants/spotlight-config-schema.constant";
export { MemoryDeviceSearchIndexDriver } from "#core/drivers/memory-device-search-index.driver";
export { indexableItems } from "#core/functions/indexable-items.function";
export { SpotlightIndexer } from "#core/services/spotlight-indexer.service";
export type { DeviceSearchRecord } from "#core/types/device-search-record.type";
export type { DeviceSession } from "#core/types/device-session.type";
