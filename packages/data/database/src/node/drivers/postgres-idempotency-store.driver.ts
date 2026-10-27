/**
 * Stackra file contract:
 * Purpose: the Postgres driver of `@stackra/actions`' `IdempotencyStore` port (driver name `postgres`): each scoped
 *          Idempotency-Key is one row of `database.idempotency_keys` with its fingerprint and, once done, its output,
 *          claimed atomically and replayed until it expires. The durable store for a deployment whose keys must
 *          outlive a cache restart.
 * Boundary: every call runs in its own transaction (`requiresNew`), so a claim commits before the action's unit of
 *           work starts and a failed action's rollback never frees it; `release` does. A claim is one upsert that
 *           takes a free or expired key and leaves a live one untouched, so two concurrent calls never both run.
 *           The output must be JSON-serialisable, as every action output is. Each claim also sweeps up to 100 expired
 *           keys, so the table stays bounded without a job. Raw SQL with every value bound (ADR 0160).
 * Runtime: node
 * Governing contract: ADR 0136 (decision 3: key, payload hash and result, 24 hours); ADR 0138 (as amended: the
 *                     idempotency step); ADR 0396 (decision 2); ADR 0160.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { IdempotencyStore } from "@stackra/actions/contracts";
import type { IdempotencyRecord } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";

import type { Database } from "#core/ports/database.port";

/** The table. */
const KEYS = '"database"."idempotency_keys"';

/** How many expired keys one claim removes at most. */
const SWEEP = 100;

/**
 * Keeps Idempotency-Keys in Postgres.
 *
 * @example
 * // runway.yaml (production): config.actions.stores: { idempotency: postgres }
 * const earlier = await store.claim(key, fingerprint, Duration.hours(24));
 */
export class PostgresIdempotencyStoreDriver extends Driver(IdempotencyStore) {
  /** The connected database each call opens its own transaction on. */
  private readonly database: Database;

  /**
   * @param database - the connected database.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /**
   * Implements `IdempotencyStore.claim`, documented there.
   *
   * @throws Error when the key keeps changing hands between the claim and the read (a third racing call released it
   *         twice in a row).
   */
  async claim(
    key: string,
    fingerprint: string,
    ttl: Duration,
  ): Promise<IdempotencyRecord | undefined> {
    const ms = Math.max(1, Math.ceil(Duration.toMilliseconds(ttl)));
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const earlier = await this.run(async (em) => {
        // raw-sql: the claim is one upsert: a free or expired key is taken, a live one is left as it is
        const taken = (await em.execute(
          `insert into ${KEYS} (key, fingerprint, done, output, expires_at) ` +
            "values (?, ?, false, null, now() + (? * interval '1 millisecond')) " +
            "on conflict (key) do update set fingerprint = excluded.fingerprint, done = false, output = null, " +
            `expires_at = excluded.expires_at, updated_at = now() where ${KEYS}.expires_at <= now() returning key`,
          [key, fingerprint, ms],
        )) as unknown as readonly unknown[];
        if (taken.length > 0) {
          // raw-sql: a bounded sweep of expired keys, skipping rows another claim holds
          await em.execute(
            `delete from ${KEYS} where key in (select key from ${KEYS} where expires_at <= now() ` +
              "order by expires_at limit ? for update skip locked)",
            [SWEEP],
          );
          return "claimed" as const;
        }
        // raw-sql: the live record the key already holds
        const [row] = (await em.execute(
          `select fingerprint, done, output from ${KEYS} where key = ? and expires_at > now()`,
          [key],
        )) as unknown as readonly Record<string, unknown>[];
        return row;
      });
      if (earlier === "claimed") return undefined;
      if (earlier !== undefined) {
        const held = String(earlier["fingerprint"]);
        return earlier["done"] === true
          ? { fingerprint: held, done: true, output: earlier["output"] ?? null }
          : { fingerprint: held, done: false };
      }
    }
    throw new Error(`The idempotency key ${key} changed hands three times while it was claimed`);
  }

  /** Implements `IdempotencyStore.complete`, documented there. */
  async complete(key: string, output: unknown): Promise<void> {
    await this.run(async (em) => {
      // raw-sql: the held key is marked done with its output, keeping its expiry
      await em.execute(
        `update ${KEYS} set done = true, output = ?::jsonb, updated_at = now() where key = ? and done = false`,
        [JSON.stringify(output ?? null), key],
      );
    });
  }

  /** Implements `IdempotencyStore.release`, documented there. */
  async release(key: string): Promise<void> {
    await this.run(async (em) => {
      // raw-sql: a held key is freed after a failed call; a done key stays to replay
      await em.execute(`delete from ${KEYS} where key = ? and done = false`, [key]);
    });
  }

  /** Runs `work` in a transaction of its own, committed whatever the caller's transaction does. */
  private run<T>(work: (em: EntityManager) => Promise<T>): Promise<T> {
    return this.database.transaction(() => work(this.database.em() as EntityManager), {
      requiresNew: true,
    });
  }
}
