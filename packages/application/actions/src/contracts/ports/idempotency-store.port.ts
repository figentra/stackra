/**
 * Stackra file contract:
 * Purpose: the `IdempotencyStore` port: where the idempotency step keeps each scoped Idempotency-Key with the
 *          fingerprint of its input and, once the call succeeded, its output, so a retry replays instead of running
 *          twice.
 * Boundary: an abstract class that is its own token (owner decision 2026-10-21: the store sits behind a port), keyed
 *           `actions.IdempotencyStore`. This package ships the memory and Valkey drivers; the durable Postgres driver
 *           comes through `@stackra/database`. `claim` is atomic per key, so two concurrent calls with one key never
 *           both run. A claim holds the key for a short lease (`IDEMPOTENCY_LEASE`); `complete` keeps the output for the
 *           replay window, so a call that never finished frees its key after the lease, not after 24 hours. A store
 *           that joins the running transaction (`joinsTransaction`) is completed inside the call's transaction, so the
 *           output commits with the writes; the pipeline never calls `release` after a commit (STA-2797).
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3: key, payload hash and result, 24 hours); ADR 0138 (as amended: the
 *                     idempotency step after flag); ADR 0495 (notes of 2026-11-01 and 2026-11-26).
 */
import { Port } from "@stackra/contracts";
import type { Duration } from "@stackra/contracts";
import type { StoredRefusal } from "@stackra/errors";

import type { IdempotencyRecord } from "#contracts/types/idempotency-record.type";

/**
 * Keeps each Idempotency-Key with its payload fingerprint and result, so a repeated call replays.
 *
 * @example
 * const earlier = await store.claim(key, fingerprint, Duration.minutes(15));
 * if (earlier === undefined) {
 *   await store.complete(key, fingerprint, await run(), Duration.hours(24));
 * }
 */
export abstract class IdempotencyStore extends Port {
  /** Type-only port key, so `DriverName<IdempotencyStore>` narrows to this port's drivers. */
  declare readonly "~key": "actions.IdempotencyStore";

  /**
   * Whether claim, complete and release join a database transaction already running, so they commit or roll back
   * with it. The pipeline completes such a store inside the call's transaction. A store that cannot (Valkey, memory)
   * is completed after the commit, and refused for a call that joined an outer transaction (ADR 0495, note of
   * 2026-11-01).
   */
  readonly joinsTransaction: boolean = false;

  /**
   * Claims `key` for a call with `fingerprint`, held for `lease`: resolves to `undefined` when the key was free or its
   * earlier holder's lease (or a done record's window) had lapsed (it is now held, not done), or to the live record
   * already held under it, untouched.
   */
  abstract claim(
    key: string,
    fingerprint: string,
    lease: Duration,
  ): Promise<IdempotencyRecord | undefined>;

  /**
   * Marks `key` done with `output` for `ttl` from now (the replay window), when this call holds it or it is free (a
   * lease that lapsed before a late completion). A key another call holds, or one already done, is left as it is.
   */
  abstract complete(
    key: string,
    fingerprint: string,
    output: unknown,
    ttl: Duration,
  ): Promise<void>;

  /**
   * Marks `key` done with the `refusal` that ended its call, until `ttl` ends. The key's claim may be gone (a
   * joined store's rolled-back transaction took it), so the record is written whole, with `fingerprint`.
   */
  abstract completeRefused(
    key: string,
    fingerprint: string,
    refusal: StoredRefusal,
    ttl: Duration,
  ): Promise<void>;

  /**
   * Frees the held `key` after a call that failed before anything committed, so a retry may run. A done key is left
   * as it is; a driver that tells holders apart (Valkey) also leaves a claim another call took after this one's
   * lease lapsed.
   */
  abstract release(key: string): Promise<void>;
}
