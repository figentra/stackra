/**
 * Stackra file contract:
 * Purpose: `CacheRememberOptions`, what a `remember` may add to a `put`: a stale window served while one caller
 *          reloads (stale-while-revalidate), and a load shared across instances through the `CacheLock` port.
 * Boundary: a type only, plain data. `stale` extends how long the store keeps the entry, not how long it is fresh: `get`
 *           never returns a stale value. `lock` matters only for a driver whose store several instances share (valkey,
 *           workers); the memory and storage drivers ignore it, their single-flight already covers their one process.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 4: stampede protection and stale-while-revalidate); ADR 0297 (decision 3).
 */
import type { Duration } from "@stackra/contracts";

import type { CachePutOptions } from "#contracts/types/cache-put-options.type";

/**
 * Options of `Cache.remember`.
 *
 * @example
 * await cache.remember(CacheKey.of(PriceList, id), Duration.minutes(5), () => this.load(id), {
 *   stale: Duration.minutes(1),
 *   lock: true,
 * });
 */
export interface CacheRememberOptions extends CachePutOptions {
  /**
   * How long after the lifetime an entry is still served by `remember` while one caller reloads it in the background;
   * absent or zero serves nothing stale.
   */
  readonly stale?: Duration;

  /**
   * Whether one load runs across every instance that shares the store: the others wait up to `cache.fill.wait` for its
   * value, then load themselves. A stale reload under `lock` runs on one instance only.
   */
  readonly lock?: boolean;
}
