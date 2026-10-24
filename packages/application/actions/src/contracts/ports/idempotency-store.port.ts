/**
 * Stackra file contract:
 * Purpose: the `IdempotencyStore` port: where the idempotency step keeps each scoped Idempotency-Key with the
 *          fingerprint of its input and, once the call succeeded, its output, so a retry replays instead of running
 *          twice.
 * Boundary: an abstract class that is its own token (owner decision 2026-10-21: the store sits behind a port). This
 *           package ships the memory driver; the durable Postgres driver comes through `@stackra/database`. `claim` is
 *           atomic per key, so two concurrent calls with one key never both run.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3: key, payload hash and result, 24 hours); ADR 0138 (as amended: the
 *                     idempotency step after flag).
 */
import { Port } from "@stackra/contracts";
import type { Duration } from "@stackra/contracts";

import type { IdempotencyRecord } from "#contracts/types/idempotency-record.type";

/**
 * Keeps each Idempotency-Key with its payload fingerprint and result, so a repeated call replays.
 *
 * @example
 * const earlier = await store.claim(key, fingerprint, Duration.hours(24));
 * if (earlier === undefined) {
 *   await store.complete(key, await run());
 * }
 */
export abstract class IdempotencyStore extends Port {
  /**
   * Claims `key` for a call with `fingerprint`, for `ttl`: resolves to `undefined` when the key was free (it is now
   * held, not done), or to the record already held under it, untouched.
   */
  abstract claim(
    key: string,
    fingerprint: string,
    ttl: Duration,
  ): Promise<IdempotencyRecord | undefined>;

  /** Marks the held `key` done with `output`, kept until the claim's `ttl` ends. */
  abstract complete(key: string, output: unknown): Promise<void>;

  /** Frees the held `key` after a failed call, so a retry may run. */
  abstract release(key: string): Promise<void>;
}
