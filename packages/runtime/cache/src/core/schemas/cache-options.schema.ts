/**
 * Stackra file contract:
 * Purpose: `CacheOptions`, the shape of `CacheConfig`: how many entries the memory driver keeps before it drops the
 *          least recently read one.
 * Boundary: a shape class; it registers this package's own schema (`CACHE_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(CacheConfig)` validates with no generated file. A network driver reads its own
 *           configuration, not this one.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 1: memory LRU); ADR 0294 (decisions 19 and 26).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { CACHE_CONFIG_SCHEMA } from "#core/constants/cache-config-schema.constant";

/**
 * The cache's settings.
 *
 * @example
 * export class CacheConfig extends BaseCacheConfig {
 *   override maxEntries = 50_000;
 * }
 */
export class CacheOptions extends Schema {
  /** Entries the memory driver keeps; past it, the least recently read entry goes. */
  @Int({ min: 1 })
  maxEntries = 10_000;
}

registerSchemas([[CacheOptions, CACHE_CONFIG_SCHEMA]]);
