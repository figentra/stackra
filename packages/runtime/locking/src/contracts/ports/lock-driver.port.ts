/**
 * Stackra file contract:
 * Purpose: the `LockDriver` port: the store behind `Locks`. It gives work a place where its locks can live, takes a
 *          set of keys without waiting, renews a lease and releases it. Config `locking.driver` picks the driver
 *          (`postgres`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `locking.LockDriver`. A driver never waits: `Locks` does the
 *           waiting, the key order and the renewal timer, so every driver behaves the same to a caller. `tryAcquire`,
 *           `renew` and `release` are called inside `within`. A leaf file: it imports nothing outside `src/contracts`
 *           but the `Port` base and `Duration`.
 * Runtime: isomorphic
 * Governing contract: ADR 0103 (decisions 1 and 2); ADR 0149 (decisions 1 to 3); ADR 0142 (drivers behind ports);
 *                     ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";
import type { Duration } from "@stackra/contracts";

import type { LockLease } from "#contracts/types/lock-lease.type";

/**
 * A lock store.
 *
 * @example
 * export class ValkeyLockDriver extends Driver(LockDriver) {
 *   async tryAcquire(keys: readonly string[], owner: string, ttl: Duration): Promise<LockLease | undefined> { ... }
 * }
 */
export abstract class LockDriver extends Port {
  /** Type-only port key, so `DriverName<LockDriver>` narrows to this port's drivers. */
  declare readonly "~key": "locking.LockDriver";

  /** Runs `work` where this driver's locks can live, and gives back its result. */
  abstract within<T>(work: () => Promise<T>): Promise<T>;

  /**
   * A lease on every key of `keys` (sorted, each once) for `ttl`, or `undefined` at once when another lease holds any
   * of them.
   */
  abstract tryAcquire(
    keys: readonly string[],
    owner: string,
    ttl: Duration,
  ): Promise<LockLease | undefined>;

  /** Keeps `lease` held for `ttl` from now; `false` when it is no longer held, so it was lost. */
  abstract renew(lease: LockLease, ttl: Duration): Promise<boolean>;

  /** Frees the keys `lease` still holds; a lease that was lost frees nothing. */
  abstract release(lease: LockLease): Promise<void>;
}
