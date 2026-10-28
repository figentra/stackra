/**
 * Stackra file contract:
 * Purpose: the `local` driver of the `CacheLock` port, the default: it always runs the fill, so a
 *          `remember(..., { lock: true })` behaves as without `lock` and single-flight stays per process.
 * Boundary: holds nothing and never refuses; the right driver for one instance, a client, or a member with no
 *           @stackra/locking. A member whose instances share a store selects `locks` (`cache.lock: locks`).
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 4); ADR 0294 (decision 4).
 */
import { Driver } from "@stackra/container";
import type { Duration } from "@stackra/contracts";

import { CacheLock } from "#contracts/ports/cache-lock.port";

/** Runs every fill in this process, holding nothing. */
export class LocalCacheLockDriver extends Driver(CacheLock) {
  /** Runs `work` and answers `true`. */
  async tryWith(_key: string, _ttl: Duration, work: () => Promise<void>): Promise<boolean> {
    await work();
    return true;
  }
}
