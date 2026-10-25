/**
 * Stackra file contract:
 * Purpose: `CacheConfig`, the cache's configuration (key `cache.cache`): the memory driver's entry bound.
 * Boundary: a configuration class over `CacheOptions` with no env map; runway's `config.cache.cache` layer sets it per
 *           environment. A host overrides it as `class CacheConfig extends BaseCacheConfig` with `override` members
 *           only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0150 (decision 1).
 */
import { Config } from "@stackra/config";

import { CacheOptions } from "#core/schemas/cache-options.schema";

/**
 * The cache's configuration.
 *
 * @example
 * import { CacheConfig as BaseCacheConfig } from "@stackra/cache";
 *
 * export class CacheConfig extends BaseCacheConfig {
 *   override maxEntries = 50_000;
 * }
 */
export class CacheConfig extends Config({ schema: CacheOptions }) {}
