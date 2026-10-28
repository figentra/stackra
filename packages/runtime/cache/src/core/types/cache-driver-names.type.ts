/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entries of the `Cache`, `CacheNamespace`, `CacheLock` and `CacheMetrics` ports, so the
 *          `driver`, `namespace`, `lock` and `metrics` fields and their runway values take exactly their driver names.
 * Boundary: a module augmentation only; the stand-in for the entry this package's generated wiring writes (ADR 0263
 *           decision 9). `CacheOptions` imports this file so the augmentation travels with the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import type { CACHE_DRIVERS } from "#core/constants/cache-drivers.constant";
import type { CACHE_LOCK_DRIVERS } from "#core/constants/cache-lock-drivers.constant";
import type { CACHE_METRICS_DRIVERS } from "#core/constants/cache-metrics-drivers.constant";
import type { CACHE_NAMESPACE_DRIVERS } from "#core/constants/cache-namespace-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `Cache` (`memory`, `storage`, `valkey`, `workers`). */
    "cache.Cache": (typeof CACHE_DRIVERS)[number];
    /** The driver names of `CacheNamespace` (`shared`, and @stackra/scope's `scope`). */
    "cache.CacheNamespace": (typeof CACHE_NAMESPACE_DRIVERS)[number];
    /** The driver names of `CacheLock` (`local`, and @stackra/locking's `locks`). */
    "cache.CacheLock": (typeof CACHE_LOCK_DRIVERS)[number];
    /** The driver names of `CacheMetrics` (`none`, `counting`, `logger`). */
    "cache.CacheMetrics": (typeof CACHE_METRICS_DRIVERS)[number];
  }
}
