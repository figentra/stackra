/**
 * Stackra file contract:
 * Purpose: the memory driver of the `LockDriver` port: each held key's lease token and expiry in process memory, every
 *          key or none taken, expiry read from the `Clock`, tokens counted from one.
 * Boundary: one process only, so it serialises callers inside that process and nothing across processes: tests and a
 *           single-process deployment. A lease lapses at its expiry unless renewed; a lapsed lease can neither renew
 *           nor free a key another lease has taken since. Expired entries are replaced when taken again, never swept
 *           by a timer.
 * Runtime: isomorphic
 * Governing contract: ADR 0103 (decision 2: a memory driver for tests); ADR 0149 (decisions 2 and 3); ADR 0266 (memory
 *                     drivers first).
 */
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";

import { LockDriver } from "#contracts/index";
import type { LockLease } from "#contracts/index";

/** The lease that holds a key, by token, and the instant, in epoch milliseconds, at which it lapses. */
type Hold = { readonly token: number; readonly expiresAt: number };

/**
 * Holds locks in process memory.
 *
 * @example
 * export class LockingConfig extends BaseLockingConfig {
 *   override driver: DriverName<LockDriver> = "memory";
 * }
 */
export class MemoryLockDriver extends Driver(LockDriver) {
  /** Key to the lease that holds it. */
  private readonly holds = new Map<string, Hold>();

  /** The last token given. */
  private lastToken = 0;

  private readonly clock: Clock;

  /**
   * @param clock - the time source of expiry.
   */
  constructor(clock: Clock) {
    super();
    this.clock = clock;
  }

  /** Runs `work` as it is: memory locks need no surrounding transaction. */
  within<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }

  /** See `LockDriver.tryAcquire`. */
  tryAcquire(
    keys: readonly string[],
    owner: string,
    ttl: Duration,
  ): Promise<LockLease | undefined> {
    const now = this.clock.now().getTime();
    if (keys.some((key) => (this.holds.get(key)?.expiresAt ?? now) > now))
      return Promise.resolve(undefined);
    this.lastToken += 1;
    const hold: Hold = { token: this.lastToken, expiresAt: now + Duration.toMilliseconds(ttl) };
    for (const key of keys) this.holds.set(key, hold);
    return Promise.resolve({ keys: [...keys], owner, token: hold.token });
  }

  /** See `LockDriver.renew`. */
  renew(lease: LockLease, ttl: Duration): Promise<boolean> {
    const now = this.clock.now().getTime();
    const held = lease.keys.every((key) => {
      const hold = this.holds.get(key);
      return hold?.token === lease.token && hold.expiresAt > now;
    });
    if (!held) return Promise.resolve(false);
    const hold: Hold = { token: lease.token, expiresAt: now + Duration.toMilliseconds(ttl) };
    for (const key of lease.keys) this.holds.set(key, hold);
    return Promise.resolve(true);
  }

  /** See `LockDriver.release`. */
  release(lease: LockLease): Promise<void> {
    for (const key of lease.keys)
      if (this.holds.get(key)?.token === lease.token) this.holds.delete(key);
    return Promise.resolve();
  }
}
