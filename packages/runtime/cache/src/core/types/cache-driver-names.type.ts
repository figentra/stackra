/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of the `Cache` port, so the `driver` field typed `DriverName<Cache>` and a runway
 *          `cache.driver` value take exactly this package's driver names.
 * Boundary: a module augmentation only; the stand-in for the entry this package's generated wiring writes (ADR 0263
 *           decision 9). `CacheOptions` imports this file so the augmentation travels with the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import type { CACHE_DRIVERS } from "#core/constants/cache-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `Cache` (`memory`, `storage`, `valkey`, `workers`). */
    "cache.Cache": (typeof CACHE_DRIVERS)[number];
  }
}
