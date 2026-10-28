/**
 * Stackra file contract:
 * Purpose: `CACHE_LOCK_DRIVERS`, the driver names config `cache.lock` may select for the `CacheLock` port: this
 *          package's `local` (`LocalCacheLockDriver`, the default) and `locks`, which `@stackra/locking` ships
 *          (`LocksCacheLockDriver`).
 * Boundary: the stand-in for the names gen derives from the driver files of the declared packages; the shipped schema's
 *           `lock` enum and the `DriverRegistry` entry are both read from it. Internal to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4: a driver choice is a config field typed `DriverName<Port>`); ADR 0150
 *                     (decision 4); STA-1435.
 */

/** The `CacheLock` drivers, by name. */
export const CACHE_LOCK_DRIVERS = ["local", "locks"] as const;
