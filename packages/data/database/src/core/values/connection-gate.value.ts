/**
 * Stackra file contract:
 * Purpose: `ConnectionGate`, the admission of one pool's transactions by how deep in a chain they open: a call holds
 *          its isolation transaction while a `requiresNew` store (permission's policy snapshot, the rate limit, the
 *          access log) opens another, so with as many calls as connections every call held one and waited for a second
 *          that never came (STA-1716). The gate keeps one place per level below the top for the deeper transactions,
 *          so a chain can always finish: at most `max - (levels - d)` transactions run at depth `d` or shallower.
 * Boundary: counts places, not connections: `PostgresDatabaseDriver` asks it before each transaction that takes a
 *           connection of its own (a top-level one or a `requiresNew`), never for a savepoint; a query outside a
 *           transaction holds nothing while it waits, so it is not counted. The depth is the async context's: each
 *           admitted transaction runs its work one level deeper. `levels` is `nesting`, capped at `max`: a chain deeper
 *           than `max` could never get its connections, so it is refused at once (`RangeError`) instead of waiting; a
 *           chain deeper than `nesting` but within `max` shares the deepest level, where the guarantee no longer holds.
 *           A transaction that waits past the pool's `acquireTimeout` is refused as retryable
 *           (`ConnectionPoolExhaustedError`); a gate built with no wait lets it wait. Waiters are served in arrival order, skipping one that does not fit yet,
 *           so a shallow waiter never blocks a deeper one.
 * Runtime: node
 * Governing contract: ADR 0473 (decision 2 and the 2026-11-26 note: the gate); ADR 0495 (consequences); STA-1716.
 */
import { AsyncLocalStorage } from "node:async_hooks";

import { ConnectionPoolExhaustedError } from "#core/errors/connection-pool-exhausted.error";

/** A transaction waiting for a place at its level. */
interface Waiter {
  readonly level: number;
  readonly admit: () => void;
}

/**
 * The admission of one pool's transactions.
 *
 * @example
 * const gate = new ConnectionGate(10, 4);
 * await gate.hold(() => em.transactional(work)); // one of the seven top-level places a pool of 10 keeps
 */
export class ConnectionGate {
  /** The connections of the pool. */
  readonly max: number;

  /** The levels a place is kept for: `nesting`, capped at `max`. */
  readonly levels: number;

  /** How long a transaction waits for its place, in milliseconds; unbounded when undefined. */
  private readonly waitMs: number | undefined;

  /** The places held at each level (index 0 is the top). */
  private readonly held: number[];

  /** The transactions waiting, in arrival order. */
  private readonly waiting: Waiter[] = [];

  /** How many connections the running chain holds. */
  private readonly depth = new AsyncLocalStorage<number>();

  /**
   * @param max - the connections of the pool.
   * @param nesting - the deepest chain of connections one unit holds at once.
   * @param waitMs - how long a transaction may wait for its place; unbounded when left out.
   * @throws RangeError when `max` or `nesting` is not a whole number of at least 1, or `waitMs` is negative.
   */
  constructor(max: number, nesting: number, waitMs?: number) {
    if (!Number.isInteger(max) || max < 1)
      throw new RangeError(`a pool of ${max} connections cannot serve a query`);
    if (!Number.isInteger(nesting) || nesting < 1)
      throw new RangeError(`a chain nests at least one connection deep, got ${nesting}`);
    if (waitMs !== undefined && !(waitMs >= 0)) throw new RangeError(`${waitMs} ms is not a wait`);
    this.max = max;
    this.levels = Math.min(nesting, max);
    this.waitMs = waitMs;
    this.held = Array.from({ length: this.levels }, () => 0);
  }

  /**
   * Runs `work`, which opens a transaction on a connection of its own, once its level has a place, one level deeper.
   *
   * @throws RangeError when the chain would hold more connections than the pool has.
   * @throws ConnectionPoolExhaustedError when no place came free within the wait.
   */
  async hold<T>(work: () => Promise<T>): Promise<T> {
    const depth = (this.depth.getStore() ?? 0) + 1;
    if (depth > this.max)
      throw new RangeError(
        `a transaction chain would hold ${depth} connections at once, which a pool of ${this.max} can never give it: raise the pool's max or open fewer requiresNew transactions inside one another`,
      );
    const level = Math.min(depth, this.levels);
    await this.admit(level);
    try {
      return await this.depth.run(depth, work);
    } finally {
      this.count(level, -1);
      this.wake();
    }
  }

  /** The places held at each level (the top first) and how many transactions wait. */
  snapshot(): { readonly held: readonly number[]; readonly waiting: number } {
    return { held: [...this.held], waiting: this.waiting.length };
  }

  /** Whether one more place at `level` keeps every level within its share. */
  private fits(level: number): boolean {
    let running = 0;
    for (let at = 1; at <= this.levels; at += 1) {
      running += this.held[at - 1] ?? 0;
      if (at >= level && running + 1 > this.max - (this.levels - at)) return false;
    }
    return true;
  }

  /** Takes a place at `level`, now or once one comes free. */
  private admit(level: number): Promise<void> {
    if (this.fits(level)) {
      this.count(level, 1);
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const waiter: Waiter = {
        level,
        admit: () => {
          if (timer !== undefined) clearTimeout(timer);
          resolve();
        },
      };
      if (this.waitMs !== undefined)
        timer = setTimeout(() => {
          this.waiting.splice(this.waiting.indexOf(waiter), 1);
          reject(ConnectionPoolExhaustedError.create());
        }, this.waitMs);
      this.waiting.push(waiter);
    });
  }

  /** Admits every waiter that fits now, in arrival order. */
  private wake(): void {
    let index = 0;
    while (index < this.waiting.length) {
      const waiter = this.waiting[index];
      if (waiter === undefined || !this.fits(waiter.level)) {
        index += 1;
        continue;
      }
      this.waiting.splice(index, 1);
      this.count(waiter.level, 1);
      waiter.admit();
    }
  }

  /** Counts `change` places at `level`: 1 taken, -1 given back. */
  private count(level: number, change: 1 | -1): void {
    this.held[level - 1] = (this.held[level - 1] ?? 0) + change;
  }
}
