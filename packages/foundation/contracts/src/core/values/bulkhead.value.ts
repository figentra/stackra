/**
 * Stackra file contract:
 * Purpose: `Bulkhead`, the admission of calls into one bounded compartment: at most `limit` hold a place at once, at
 *          most `queue` more wait for one (first come, first served), and a waiter that gets none within `maxWaitMs`
 *          is turned away. A full compartment turns a call away at once, so an overload or a slow dependency sheds the
 *          excess instead of piling it up until the whole process stalls.
 * Boundary: in process and in memory; it counts places, never what a call does. `enter()` resolves with a release
 *           function or with `undefined` (turned away) and never rejects: the caller throws its own refusal (the
 *           server's `AppOverloadedError`, an integration's `ProviderUnavailableError`). Release is idempotent, and a
 *           freed place passes straight to the oldest waiter.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (a turned-away call is an `Unavailable` refusal of the caller); ADR 0143 (decision 3:
 *                     a draining server still waits for what it admitted); STA-1467.
 */
import type { BulkheadOptions } from "#core/types/bulkhead-options.type";

/** A call waiting for a place. */
interface Waiter {
  readonly admit: (release: () => void) => void;
}

/**
 * A bounded compartment of concurrent calls.
 *
 * @example
 * const bulkhead = new Bulkhead({ limit: 8, queue: 16, maxWaitMs: 2000 });
 * const release = await bulkhead.enter();
 * if (release === undefined) throw AppOverloadedError.create({ retryAfterMs: 1000 });
 * try { return await work(); } finally { release(); }
 */
export class Bulkhead {
  /** How many calls hold a place at once. */
  readonly limit: number;

  /** How many more calls may wait for a place. */
  readonly queue: number;

  /** How long a call waits for a place, in milliseconds; unbounded when undefined. */
  private readonly maxWaitMs: number | undefined;

  /** The places held now. */
  private held = 0;

  /** The calls waiting, oldest first. */
  private readonly waiting: Waiter[] = [];

  /**
   * @throws RangeError when `limit` is not a whole number from 1, `queue` not a whole number from 0, or `maxWaitMs`
   *         negative or not a number.
   */
  constructor(options: BulkheadOptions) {
    const { limit, queue = 0, maxWaitMs } = options;
    if (!Number.isInteger(limit) || limit < 1)
      throw new RangeError(`a bulkhead holds at least one call at once, got ${limit}`);
    if (!Number.isInteger(queue) || queue < 0)
      throw new RangeError(`a bulkhead queue holds zero or more calls, got ${queue}`);
    if (maxWaitMs !== undefined && !(maxWaitMs >= 0))
      throw new RangeError(`${maxWaitMs} ms is not a wait`);
    this.limit = limit;
    this.queue = queue;
    this.maxWaitMs = maxWaitMs;
  }

  /** The calls holding a place now. */
  get active(): number {
    return this.held;
  }

  /** The calls waiting for a place now. */
  get queued(): number {
    return this.waiting.length;
  }

  /**
   * Takes a place now, or waits for one when the queue has room.
   *
   * @returns the function that gives the place back (idempotent), or `undefined` when the call is turned away: the
   *          compartment and its queue are full, or no place came free within `maxWaitMs`.
   */
  enter(): Promise<(() => void) | undefined> {
    if (this.held < this.limit) {
      this.held += 1;
      return Promise.resolve(this.releaser());
    }
    if (this.waiting.length >= this.queue || this.maxWaitMs === 0)
      return Promise.resolve(undefined);
    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const waiter: Waiter = {
        admit: (release) => {
          if (timer !== undefined) clearTimeout(timer);
          resolve(release);
        },
      };
      if (this.maxWaitMs !== undefined)
        timer = setTimeout(() => {
          const index = this.waiting.indexOf(waiter);
          if (index !== -1) this.waiting.splice(index, 1);
          resolve(undefined);
        }, this.maxWaitMs);
      this.waiting.push(waiter);
    });
  }

  /** A release function for one held place: hands it to the oldest waiter, or frees it. */
  private releaser(): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = this.waiting.shift();
      if (next === undefined) this.held -= 1;
      else next.admit(this.releaser());
    };
  }
}
