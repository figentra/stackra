/**
 * Stackra file contract:
 * Purpose: `CacheOptions`, the shape of `CacheConfig`: which driver runs, which namespace, fill-lock and metrics drivers
 *          it uses, how many entries the memory driver keeps before it drops the least recently read one, how far
 *          lifetimes are jittered, how long a caller waits for another instance's fill, the Valkey server and key
 *          prefix, the Postgres tables' schema and sweep size, and the Workers KV binding.
 *          `health` tunes `CacheHealthIndicatorDriver`, the `/readyz` probe.
 * Boundary: a shape class; it registers this package's own schema (`CACHE_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(CacheConfig)` validates with no generated file. `valkey` and `workers` are nested
 *           objects a host override replaces whole. The Valkey URL carries the password, so it is the
 *           `CACHE_VALKEY_URL` secret, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 1, amended by ADR 0297 decision 3; decision 4); ADR 0294 (decisions 4, 19 and
 *                     26); ADR 0173 (secrets by name).
 */
import "#core/types/cache-driver-names.type";

import { Secret } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { Field, Int, Num, registerSchemas, Schema } from "@stackra/validation";

import type { Cache } from "#contracts/ports/cache.port";
import type { CacheLock } from "#contracts/ports/cache-lock.port";
import type { CacheMetrics } from "#contracts/ports/cache-metrics.port";
import type { CacheNamespace } from "#contracts/ports/cache-namespace.port";
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

  /**
   * The largest fraction (0 to 1) each lifetime is shortened by at random, so entries written together do not all
   * expire together; `0` keeps lifetimes exact.
   */
  @Num({
    min: 0,
    max: 1,
  })
  jitter = 0;

  /** How long a `remember(..., { lock: true })` caller waits for another instance's fill, and how often it reads. */
  // reason: a nested option a host override replaces whole; the shipped config schema holds its rules
  @Field(CACHE_CONFIG_SCHEMA.shape.fill)
  fill: {
    /** The longest wait before this caller loads itself; also how long the fill lock outlives a dead holder. */
    wait: Duration;
    /** How often the store is read while waiting. */
    poll: Duration;
  } = { wait: Duration.seconds(5), poll: Duration.parse("50ms") };

  /** The `valkey` driver's server (`redis://` or `rediss://`, with its password); empty until the secret is set. */
  @Secret("CACHE_VALKEY_URL")
  valkeyUrl = "";

  /** The `valkey` driver's keys. */
  // reason: a nested driver option a host override replaces whole; the shipped config schema holds its rules
  @Field(CACHE_CONFIG_SCHEMA.shape.valkey)
  valkey: {
    /** Put in front of every key, so members that share one server never share an entry. */
    keyPrefix: string;
  } = { keyPrefix: "cache:" };

  /** The `postgres` driver's tables. */
  // reason: a nested driver option a host override replaces whole; the shipped config schema holds its rules
  @Field(CACHE_CONFIG_SCHEMA.shape.postgres)
  postgres: {
    /** The Postgres schema holding the unlogged `entries` and `set_members` tables (snake_case). */
    schema: string;
    /** How many dead rows each write reclaims at most (0 to 10000); `0` leaves them. */
    sweep: number;
  } = { schema: "cache", sweep: 100 };

  /** The `workers` driver's Workers KV namespace. */
  // reason: a nested driver option a host override replaces whole; the shipped config schema holds its rules
  @Field(CACHE_CONFIG_SCHEMA.shape.workers)
  workers: {
    /** The binding name the namespace is bound under in the Worker's wrangler config. */
    binding: string;
  } = { binding: "CACHE" };

  /** How `CacheHealthIndicatorDriver` probes the cache for `/readyz`. */
  // reason: a nested option a host override replaces whole; the shipped config schema holds its rules
  @Field(CACHE_CONFIG_SCHEMA.shape.health)
  health: {
    /** How long the probe may take. */
    timeout: Duration;
    /** Whether a failed probe fails readiness; `false` reports `degraded` instead. */
    critical: boolean;
  } = { timeout: Duration.seconds(2), critical: true };

  /** Which driver runs; names are the driver file prefixes. `memory` keeps values in this process only. */
  driver: DriverName<Cache> = "memory";

  /**
   * Which `CacheNamespace` driver names each call's namespace: `shared` (one for every call) or `scope` (the call's
   * scope id; needs @stackra/scope). Two candidates and no selector would leave the port unresolved at boot.
   */
  namespace: DriverName<CacheNamespace> = "shared";

  /**
   * Which `CacheLock` driver shares a `remember(..., { lock: true })` fill: `local` (no lock; single-flight per
   * process) or `locks` (one fill across instances through @stackra/locking).
   */
  lock: DriverName<CacheLock> = "local";

  /** Which `CacheMetrics` driver records hits, misses, loads and evictions: `none`, `counting` or `logger`. */
  metrics: DriverName<CacheMetrics> = "none";
}

registerSchemas([[CacheOptions, CACHE_CONFIG_SCHEMA]]);
