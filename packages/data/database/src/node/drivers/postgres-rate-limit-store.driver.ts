/**
 * Stackra file contract:
 * Purpose: the Postgres driver of `@stackra/actions`' `RateLimitStore` port (driver name `postgres`): each token
 *          bucket is one row of `database.rate_limit_buckets`, locked, refilled to the caller's `now` and taken from
 *          in one transaction, so every instance of a service draws from the same bucket without a cache server.
 * Boundary: every take runs in its own transaction (`requiresNew`), so it commits whatever the action does. Tokens
 *           are kept in thousandths, so a bucket holds up to two million tokens. The caller passes `now` (the
 *           pipeline's clock), as with the memory and Valkey drivers, so all three refill the same way. A row expires
 *           once its bucket would be full again; a take sweeps up to 100 expired rows. Raw SQL with every value bound.
 * Runtime: node
 * Governing contract: ADR 0217 (decision 2: token buckets enforced in the pipeline); ADR 0396 (decision 2); ADR 0160.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { RateLimitStore } from "@stackra/actions/contracts";
import type { RateLimitBucket, RateLimitDecision } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";

import type { Database } from "#core/ports/database.port";

/** The table. */
const BUCKETS = '"database"."rate_limit_buckets"';

/** The largest capacity the integer column holds in thousandths. */
const MAX_CAPACITY = 2_000_000;

/** How many expired rows one take removes at most. */
const SWEEP = 100;

/**
 * Keeps token buckets in Postgres.
 *
 * @example
 * // runway.yaml (production): config.actions.stores: { rateLimit: postgres }
 * const decision = await store.take("area:app:ten_1", { capacity: 20, tokensPerSecond: 1 }, now);
 */
export class PostgresRateLimitStoreDriver extends Driver(RateLimitStore) {
  /** The connected database each take opens its own transaction on. */
  private readonly database: Database;

  /**
   * @param database - the connected database.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /**
   * See `RateLimitStore.take`.
   *
   * @throws RangeError for a capacity above two million tokens or below one, or a negative rate.
   */
  async take(key: string, bucket: RateLimitBucket, now: Date): Promise<RateLimitDecision> {
    const { capacity, tokensPerSecond: rate } = bucket;
    if (!(capacity >= 1 && capacity <= MAX_CAPACITY) || !(rate >= 0))
      throw new RangeError(
        `A Postgres token bucket holds 1 to ${MAX_CAPACITY} tokens and refills at 0 or more a second`,
      );
    const time = now.getTime();
    return this.database.transaction(
      async () => {
        const em = this.database.em() as EntityManager;
        // raw-sql: the bucket is created full on first use, then locked for this take
        await em.execute(
          `insert into ${BUCKETS} (key, millitokens, refilled_at, expires_at) values (?, ?, ?, ?) on conflict (key) do nothing`,
          [key, capacity * 1000, now, now],
        );
        const [row] = (await em.execute(
          `select millitokens, refilled_at from ${BUCKETS} where key = ? for update`,
          [key],
        )) as unknown as readonly Record<string, unknown>[];
        const at = new Date(row?.["refilled_at"] as string | Date).getTime();
        const held = Number(row?.["millitokens"] ?? capacity * 1000) / 1000;
        let tokens = Math.min(capacity, held + (Math.max(0, time - at) / 1000) * rate);
        const allowed = tokens >= 1;
        if (allowed) tokens -= 1;
        const full =
          rate > 0 ? new Date(time + Math.ceil(((capacity - tokens) / rate) * 1000) + 1000) : null;
        // raw-sql: the counted tokens and the time they were counted, with the time the bucket is full again
        await em.execute(
          `update ${BUCKETS} set millitokens = ?, refilled_at = ?, expires_at = ?, updated_at = now() where key = ?`,
          [Math.floor(tokens * 1000), now, full, key],
        );
        // raw-sql: a bounded sweep of buckets that are full again, skipping rows another take holds
        await em.execute(
          `delete from ${BUCKETS} where key in (select key from ${BUCKETS} where expires_at <= ? and key <> ? ` +
            "order by expires_at limit ? for update skip locked)",
          [now, key, SWEEP],
        );
        if (allowed) return { allowed, remaining: Math.floor(tokens), retryAfterMs: 0 };
        return {
          allowed,
          remaining: 0,
          retryAfterMs: rate > 0 ? Math.ceil(((1 - tokens) / rate) * 1000) : Infinity,
        };
      },
      { requiresNew: true },
    );
  }
}
