/**
 * Stackra file contract:
 * Purpose: `Locks`, the service a module service injects to run work under named server-side locks: `with` waits for
 *          the keys, `tryWith` runs only when they are free at once (one runner of a scheduled job), and both renew the
 *          lease while the work runs and release it when the work ends.
 * Boundary: a platform service over the configured `LockDriver` and the `Clock`; callers never name a driver. It sorts
 *           and de-duplicates the keys, so overlapping key sets never wait on each other in a cycle; it waits by polling
 *           the driver's try with backoff, so no driver blocks inside a caller's transaction. A key names its scope
 *           itself when it needs one. The class name is the injected platform name the template uses (as `Search` is
 *           @stackra/search's), so it carries no `Service` suffix.
 * Runtime: isomorphic
 * Governing contract: ADR 0103 (decision 1); ADR 0149 (decisions 2 and 3; decision 4's method decorator is dropped,
 *                     registry A9); ADR 0294 (decisions 16 and 17: dependencies by constructor type); ADR 0263.
 */
import { Service } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";

import type { LockDriver, LockLease } from "#contracts/index";
import { LockUnavailableError } from "#core/errors/lock-unavailable.error";

/** The first wait between two tries, in milliseconds; it doubles up to `RETRY_MS * 2 ** RETRY_DOUBLINGS`. */
const RETRY_MS = 10;

/** How many times the wait between tries doubles: 10, 20, 40, 80, then 160 ms. */
const RETRY_DOUBLINGS = 4;

/** The keys sorted, each once. */
const keysOf = (keys: string | readonly string[]): readonly string[] =>
  [...new Set(typeof keys === "string" ? [keys] : keys)].sort();

/**
 * The milliseconds of `ttl`.
 *
 * @throws RangeError when `ttl` is zero: a lease that lapses at once guards nothing.
 */
function millisecondsOf(ttl: Duration): number {
  const milliseconds = Duration.toMilliseconds(ttl);
  if (!(milliseconds > 0)) throw new RangeError(`A lock's ttl is longer than zero, not ${ttl}`);
  return milliseconds;
}

/** Resolves after `milliseconds`. */
const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

/**
 * Runs work under named locks.
 *
 * @example
 * constructor(locks: Locks) {
 *   super();
 *   this.locks = locks;
 * }
 *
 * const keys = lines.map((line) => StockLevel.lockKey(line.variantId));
 * await this.locks.with(keys, Duration.seconds(5), async () => { ... });
 */
export class Locks extends Service {
  /** The owner every lease of this process carries. */
  readonly owner: string = crypto.randomUUID();

  /** The configured store. */
  private readonly driver: LockDriver;

  /** The time source of the wait. */
  private readonly clock: Clock;

  /**
   * @param driver - the store config `locking.driver` picks.
   * @param clock - the time source of the wait.
   */
  constructor(driver: LockDriver, clock: Clock) {
    super();
    this.driver = driver;
    this.clock = clock;
  }

  /**
   * Runs `work` holding every key of `keys`, and gives back its result. Waits at most `ttl` for keys another lease
   * holds (a holder that died frees them within it); the lease is renewed every third of `ttl` while `work` runs, and
   * released when it ends, however it ends.
   *
   * @throws LockUnavailableError when a key stayed held for the whole wait; `work` did not run.
   * @throws RangeError when `ttl` is zero.
   */
  with<T>(
    keys: string | readonly string[],
    ttl: Duration,
    work: (lease: LockLease) => Promise<T>,
  ): Promise<T> {
    const sorted = keysOf(keys);
    const milliseconds = millisecondsOf(ttl);
    return this.driver.within(async () => {
      const lease = await this.acquire(sorted, ttl, milliseconds);
      return this.holding(lease, ttl, milliseconds, work);
    });
  }

  /**
   * Runs `work` holding every key of `keys` only when none is held now, without waiting; `true` when it ran. On a
   * schedule this is "one runner per tick": every instance tries, one runs.
   *
   * @throws RangeError when `ttl` is zero.
   */
  tryWith(
    keys: string | readonly string[],
    ttl: Duration,
    work: (lease: LockLease) => Promise<void>,
  ): Promise<boolean> {
    const sorted = keysOf(keys);
    const milliseconds = millisecondsOf(ttl);
    return this.driver.within(async () => {
      const lease = await this.driver.tryAcquire(sorted, this.owner, ttl);
      if (lease === undefined) return false;
      await this.holding(lease, ttl, milliseconds, work);
      return true;
    });
  }

  /**
   * A lease on `keys`, tried until it is taken or `milliseconds` have passed.
   *
   * @throws LockUnavailableError when the wait ran out.
   */
  private async acquire(
    keys: readonly string[],
    ttl: Duration,
    milliseconds: number,
  ): Promise<LockLease> {
    const deadline = this.clock.now().getTime() + milliseconds;
    for (let attempt = 0; ; attempt += 1) {
      // oxlint-disable-next-line no-await-in-loop -- each try waits for the one before it by design
      const lease = await this.driver.tryAcquire(keys, this.owner, ttl);
      if (lease !== undefined) return lease;
      const left = deadline - this.clock.now().getTime();
      if (left <= 0) throw LockUnavailableError.create();
      // oxlint-disable-next-line no-await-in-loop -- the backoff between two tries
      await sleep(Math.min(left, RETRY_MS * 2 ** Math.min(attempt, RETRY_DOUBLINGS)));
    }
  }

  /** Runs `work` under `lease`, renewing it every third of the TTL, and releases it when `work` ends. */
  private async holding<T>(
    lease: LockLease,
    ttl: Duration,
    milliseconds: number,
    work: (lease: LockLease) => Promise<T>,
  ): Promise<T> {
    let running = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const renewLater = (): void => {
      timer = setTimeout(() => {
        // A failed renewal counts as lost; the lease's fencing token guards any write after it (ADR 0149 d3).
        this.driver
          .renew(lease, ttl)
          .catch(() => false)
          .then((renewed) => {
            if (renewed && running) renewLater();
          });
      }, milliseconds / 3);
    };
    renewLater();
    try {
      return await work(lease);
    } finally {
      running = false;
      clearTimeout(timer);
      await this.driver.release(lease);
    }
  }
}
