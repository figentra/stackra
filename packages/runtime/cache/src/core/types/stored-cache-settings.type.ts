/**
 * Stackra file contract:
 * Purpose: `StoredCacheSettings`, what a driver hands `storedCache` besides its store: the lifetime jitter, the
 *          cross-instance fill wait, the `CacheLock` and the `CacheMetrics` it reports to, and the random source.
 * Boundary: a type only, internal to the package. A driver reads `jitter` and `fill` from `CacheConfig`; every field
 *           has a default in `storedCache` (no jitter, the `local` lock, no metrics, `Math.random`).
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 4).
 */
import type { Duration } from "@stackra/contracts";

import type { CacheLock } from "#contracts/ports/cache-lock.port";
import type { CacheMetrics } from "#contracts/ports/cache-metrics.port";

/** How a stored cache spreads lifetimes, shares fills and reports. */
export interface StoredCacheSettings {
  /** The largest fraction (0 to 1) a lifetime is shortened by at random, so entries written together expire apart. */
  readonly jitter: number;

  /** How long a caller waits for another instance's fill, and how often it reads the store meanwhile. */
  readonly fill: { readonly wait: Duration; readonly poll: Duration };

  /** Guards a fill across instances when `remember` asks for `lock`. */
  readonly lock: CacheLock;

  /** Receives hits, misses, loads and evictions. */
  readonly metrics: CacheMetrics;

  /** A number in [0, 1); `Math.random` unless a test fixes it. */
  readonly random: () => number;
}
