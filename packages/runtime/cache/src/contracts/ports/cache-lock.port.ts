/**
 * Stackra file contract:
 * Purpose: the `CacheLock` port: runs a cache fill only when no other instance runs one for the same key, so a
 *          `remember(..., { lock: true })` loads once across every instance that shares a store.
 * Boundary: an abstract class that is its own token, keyed `cache.CacheLock`; config `cache.lock` picks the driver:
 *           `local` (this package: always runs, single-flight stays per process) or `locks` (@stackra/locking, over
 *           `Locks.tryWith`). A driver never waits: it runs `work` and answers `true`, or answers `false` at once when
 *           another holder has the key. A rejection of `work` rejects the call. The key already carries the namespace.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 4: stampede protection); ADR 0103 (decision 1: server-side locks); ADR 0294
 *                     (decisions 4, 15 and 16).
 */
import type { Duration } from "@stackra/contracts";
import { Port } from "@stackra/contracts";

/**
 * Guards a cache fill across instances.
 *
 * @example
 * export class LocksCacheLockDriver extends Driver(CacheLock) {
 *   tryWith(key: string, ttl: Duration, work: () => Promise<void>): Promise<boolean> {
 *     return this.locks.tryWith(key, ttl, () => work());
 *   }
 * }
 */
export abstract class CacheLock extends Port {
  /** Type-only port key, so `DriverName<CacheLock>` narrows to this port's drivers. */
  declare readonly "~key": "cache.CacheLock";

  /** Runs `work` holding `key` for at most `ttl` when nobody holds it, and answers whether it ran. */
  abstract tryWith(key: string, ttl: Duration, work: () => Promise<void>): Promise<boolean>;
}
