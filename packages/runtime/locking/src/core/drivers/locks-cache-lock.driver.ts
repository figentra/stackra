/**
 * Stackra file contract:
 * Purpose: `LocksCacheLockDriver`, the `locks` driver of @stackra/cache's `CacheLock` port: a cache fill under
 *          `Locks.tryWith`, so a `remember(..., { lock: true })` loads once across every instance that shares the
 *          configured lock store (Postgres or Valkey).
 * Boundary: never waits: another holder of the key answers `false` at once and the cache reads its store until the
 *           other fill lands. The lease is renewed while the fill runs and released when it ends, as with any
 *           `tryWith`. With the Postgres lock driver the lock joins the running transaction and holds until it ends;
 *           the fill still writes the cache before that, so waiting instances see the value. The key already carries
 *           the cache namespace. Config `cache.lock: locks` selects it.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 4: stampede protection); ADR 0103 (decision 1); ADR 0149 (decision 2);
 *                     ADR 0294 (decisions 4 and 16); STA-1435.
 */
import { CacheLock } from "@stackra/cache/contracts";
import { Driver } from "@stackra/container";
import type { Duration } from "@stackra/contracts";

import type { Locks } from "#core/services/locks.service";

/**
 * Shares a cache fill across instances through `Locks`.
 *
 * @example
 * // runway.yaml (production): config.cache: { driver: valkey, lock: locks }
 * await cache.remember(CacheKey.of(PriceList, id), Duration.minutes(5), () => this.load(id), { lock: true });
 */
export class LocksCacheLockDriver extends Driver(CacheLock) {
  /** The lock service every fill runs under. */
  private readonly locks: Locks;

  /**
   * @param locks - the configured locks (config `locking.driver`).
   */
  constructor(locks: Locks) {
    super();
    this.locks = locks;
  }

  /** Runs `work` holding `key` for `ttl` when nobody holds it, and answers whether it ran. */
  tryWith(key: string, ttl: Duration, work: () => Promise<void>): Promise<boolean> {
    return this.locks.tryWith(key, ttl, () => work());
  }
}
