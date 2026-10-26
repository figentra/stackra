/**
 * Stackra file contract:
 * Purpose: `CacheOptions`, the shape of `CacheConfig`: which driver runs, how many entries the memory driver keeps
 *          before it drops the least recently read one, the Valkey server and key prefix, and the Workers KV binding.
 * Boundary: a shape class; it registers this package's own schema (`CACHE_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(CacheConfig)` validates with no generated file. `valkey` and `workers` are nested
 *           objects a host override replaces whole. The Valkey URL carries the password, so it is the
 *           `CACHE_VALKEY_URL` secret, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 1, amended by ADR 0297 decision 3); ADR 0294 (decisions 4, 19 and 26); ADR
 *                     0173 (secrets by name).
 */
import "#core/types/cache-driver-names.type";

import { Secret } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { Int, registerSchemas, Schema } from "@stackra/validation";

import type { Cache } from "#contracts/ports/cache.port";
import { CACHE_CONFIG_SCHEMA } from "#core/constants/cache-config-schema.constant";

/**
 * The cache's settings.
 *
 * @example
 * export class CacheConfig extends BaseCacheConfig {
 *   override driver: DriverName<Cache> = "valkey";
 *   override valkey = { keyPrefix: "commerce:" };
 * }
 */
export class CacheOptions extends Schema {
  /** Entries the memory driver keeps; past it, the least recently read entry goes. */
  @Int({ min: 1 })
  maxEntries = 10_000;

  /** The `valkey` driver's server (`redis://` or `rediss://`, with its password); empty until the secret is set. */
  @Secret("CACHE_VALKEY_URL")
  valkeyUrl = "";

  /** Which driver runs; names are the driver file prefixes. `memory` keeps values in this process only. */
  driver: DriverName<Cache> = "memory";

  /** The `valkey` driver's keys. */
  valkey: {
    /** Put in front of every key, so members that share one server never share an entry. */
    keyPrefix: string;
  } = { keyPrefix: "cache:" };

  /** The `workers` driver's Workers KV namespace. */
  workers: {
    /** The binding name the namespace is bound under in the Worker's wrangler config. */
    binding: string;
  } = { binding: "CACHE" };
}

registerSchemas([[CacheOptions, CACHE_CONFIG_SCHEMA]]);
