/**
 * Stackra file contract:
 * Purpose: `MemoryIdempotencyStoreDriver`, the in-process `IdempotencyStore`: a map of scoped keys to their record and
 *          expiry, for tests, local runs and single-instance memory deployments.
 * Boundary: one process only; a restart forgets every key, so production with more than one instance binds the durable
 *           driver. `claim` is atomic because it never awaits between the read and the write. Expiry follows the
 *           Clock port, so a test moves time instead of waiting.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3); owner decision 2026-10-21 (the store behind a port).
 */
import { Driver } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";

import { IdempotencyStore } from "#contracts/ports/idempotency-store.port";
import type { IdempotencyRecord } from "#contracts/types/idempotency-record.type";

/** A stored record and when it lapses (epoch milliseconds). */
type Entry = { readonly record: IdempotencyRecord; readonly expiresAt: number };

/**
 * Keeps Idempotency-Keys in memory.
 *
 * @example
 * const store = new MemoryIdempotencyStoreDriver(clock);
 * await store.claim("orders.order.create@1:t:usr_1:k1", fingerprint, Duration.hours(24)); // undefined: claimed
 */
export class MemoryIdempotencyStoreDriver extends Driver(IdempotencyStore) {
  /** Scoped key to its entry. */
  private readonly entries = new Map<string, Entry>();

  private readonly clock: Clock;

  /** @param clock - the time source of expiry. */
  constructor(clock: Clock) {
    super();
    this.clock = clock;
  }

  /** Claims a free or lapsed key, or returns the live record under it untouched. */
  async claim(
    key: string,
    fingerprint: string,
    ttl: Duration,
  ): Promise<IdempotencyRecord | undefined> {
    const now = this.clock.now().getTime();
    const live = this.entries.get(key);
    if (live !== undefined && live.expiresAt > now) return live.record;
    this.entries.set(key, {
      record: Object.freeze({ fingerprint, done: false }),
      expiresAt: now + Duration.toMilliseconds(ttl),
    });
    return undefined;
  }

  /** Stores the output of a held key; a key that lapsed or was released meanwhile is left alone. */
  async complete(key: string, output: unknown): Promise<void> {
    const held = this.entries.get(key);
    if (held === undefined || held.record.done) return;
    this.entries.set(key, {
      record: Object.freeze({ fingerprint: held.record.fingerprint, done: true, output }),
      expiresAt: held.expiresAt,
    });
  }

  /** Frees a held key; a done key keeps its output. */
  async release(key: string): Promise<void> {
    if (this.entries.get(key)?.record.done === false) this.entries.delete(key);
  }
}
