/**
 * Stackra file contract:
 * Purpose: the Postgres driver of `@stackra/actions`' `IdempotencyStore` port (driver name `postgres`): each scoped
 *          Idempotency-Key is one row of `database.idempotency_keys` with its fingerprint and, once done, its output,
 *          claimed atomically and replayed until it expires. The durable store for a deployment whose keys must
 *          outlive a cache restart.
 * Boundary: every call joins the transaction already running (a savepoint of it), or opens its own when none runs.
 *           So a claim and a completion made inside a caller's transaction commit or roll back with it: a call that
 *           joined an outer transaction which then fails to commit leaves no done key, and its retry runs again
 *           instead of replaying a success that never committed (ADR 0495, note of 2026-11-01). A claim is one upsert
 *           that takes a free or expired key and leaves a live one untouched; a concurrent claim of a key another
 *           open transaction inserted waits for that transaction, so two concurrent calls never both run. A claim holds
 *           its key for the lease; `complete` is one upsert that marks the held key (or a lapsed one) done for the
 *           replay window, and the pipeline runs it inside the call's transaction, so the output commits with the
 *           writes and a crash after the commit leaves no key in progress (STA-2797). `release` frees a held key a
 *           failed call leaves when its transaction still commits; a done key is never freed. The table keeps no
 *           holder: a claim row never commits before its call does (the pipeline runs the steps of a keyed call in one
 *           transaction whenever a `UnitOfWork` is bound, which this package binds), so no other call can take it over
 *           while it runs. `extend`, which the pipeline asks only of a store completed after the commit, therefore
 *           checks the fingerprint, not a holder.
 *           The output must be JSON-serialisable, as every action output is. Each claim also sweeps up to 100 expired
 *           keys, so the table stays bounded without a job. Raw SQL with every value bound (ADR 0160).
 * Runtime: node
 * Governing contract: ADR 0136 (decision 3: key, payload hash and result, 24 hours); ADR 0138 (as amended: the
 *                     idempotency step); ADR 0396 (decision 2); ADR 0160; ADR 0495 (notes of 2026-11-01 and 2026-11-26).
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { IdempotencyStore } from "@stackra/actions/contracts";
import type { IdempotencyRecord } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { StoredRefusal } from "@stackra/errors";

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
 * const earlier = await store.claim(key, fingerprint, Duration.minutes(15));
 */
export class PostgresIdempotencyStoreDriver extends Driver(IdempotencyStore) {
  /** It joins the running transaction. */
  override readonly joinsTransaction = true;

  /** The connected database whose running transaction each call joins. */
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
    lease: Duration,
  ): Promise<IdempotencyRecord | undefined> {
    const ms = Math.max(1, Math.ceil(Duration.toMilliseconds(lease)));
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const earlier = await this.run(async (em) => {
        // raw-sql: the claim is one upsert: a free or expired key is taken, a live one is left as it is
        const taken = (await em.execute(
          `insert into ${KEYS} (key, fingerprint, done, output, expires_at) ` +
            "values (?, ?, false, null, now() + (? * interval '1 millisecond')) " +
            "on conflict (key) do update set fingerprint = excluded.fingerprint, done = false, output = null, refusal = null, " +
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
          `select fingerprint, done, output, refusal from ${KEYS} where key = ? and expires_at > now()`,
          [key],
        )) as unknown as readonly Record<string, unknown>[];
        return row;
      });
      if (earlier === "claimed") return undefined;
      if (earlier !== undefined) {
        const held = String(earlier["fingerprint"]);
        if (earlier["done"] !== true) return { fingerprint: held, done: false };
        return earlier["refusal"] === null || earlier["refusal"] === undefined
          ? { fingerprint: held, done: true, output: earlier["output"] ?? null }
          : { fingerprint: held, done: true, refusal: earlier["refusal"] as StoredRefusal };
      }
    }
    throw new Error(`The idempotency key ${key} changed hands three times while it was claimed`);
  }

  /**
   * Implements `IdempotencyStore.extend`, documented there: one upsert that keeps a held key with `fingerprint` (or
   * takes a free or expired one) held for `ttl`; `false` when the key is done or held for another body. The table keeps
   * no holder (see the file contract), so `holder` is not compared.
   */
  async extend(key: string, fingerprint: string, ttl: Duration): Promise<boolean> {
    const ms = Math.max(1, Math.ceil(Duration.toMilliseconds(ttl)));
    return this.run(async (em) => {
      // raw-sql: a held (or lapsed) key stays held, not done, for the replay window
      const kept = (await em.execute(
        `insert into ${KEYS} (key, fingerprint, done, output, refusal, expires_at) ` +
          "values (?, ?, false, null, null, now() + (? * interval '1 millisecond')) " +
          "on conflict (key) do update set fingerprint = excluded.fingerprint, done = false, output = null, " +
          "refusal = null, expires_at = excluded.expires_at, updated_at = now() " +
          `where (${KEYS}.done = false and ${KEYS}.fingerprint = excluded.fingerprint) or ${KEYS}.expires_at <= now() ` +
          "returning key",
        [key, fingerprint, ms],
      )) as unknown as readonly unknown[];
      return kept.length > 0;
    });
  }

  /**
   * Implements `IdempotencyStore.complete`, documented there: one upsert that marks the key held with `fingerprint`,
   * or a lapsed or missing one, done for `ttl`; a key another call holds, or one already done, is left as it is.
   */
  async complete(key: string, fingerprint: string, output: unknown, ttl: Duration): Promise<void> {
    const ms = Math.max(1, Math.ceil(Duration.toMilliseconds(ttl)));
    await this.run(async (em) => {
      // raw-sql: the held (or lapsed) key is marked done with its output for the replay window
      await em.execute(
        `insert into ${KEYS} (key, fingerprint, done, output, refusal, expires_at) ` +
          "values (?, ?, true, ?::jsonb, null, now() + (? * interval '1 millisecond')) " +
          "on conflict (key) do update set fingerprint = excluded.fingerprint, done = true, output = excluded.output, " +
          "refusal = null, expires_at = excluded.expires_at, updated_at = now() " +
          `where (${KEYS}.done = false and ${KEYS}.fingerprint = excluded.fingerprint) or ${KEYS}.expires_at <= now()`,
        [key, fingerprint, JSON.stringify(output ?? null), ms],
      );
    });
  }

  /**
   * Implements `IdempotencyStore.completeRefused`, documented there: one upsert, because the claim row may have rolled
   * back with the refusing call's transaction.
   */
  async completeRefused(
    key: string,
    fingerprint: string,
    refusal: StoredRefusal,
    ttl: Duration,
  ): Promise<void> {
    const ms = Math.max(1, Math.ceil(Duration.toMilliseconds(ttl)));
    await this.run(async (em) => {
      // raw-sql: the refusal is kept whole, whether or not the claim row survived
      await em.execute(
        `insert into ${KEYS} (key, fingerprint, done, output, refusal, expires_at) ` +
          "values (?, ?, true, null, ?::jsonb, now() + (? * interval '1 millisecond')) " +
          "on conflict (key) do update set fingerprint = excluded.fingerprint, done = true, output = null, " +
          "refusal = excluded.refusal, expires_at = excluded.expires_at, updated_at = now()",
        [key, fingerprint, JSON.stringify(refusal), ms],
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

  /** Runs `work` in the running transaction (a savepoint), or in a transaction of its own when none runs. */
  private run<T>(work: (em: EntityManager) => Promise<T>): Promise<T> {
    return this.database.transaction(() => work(this.database.em() as EntityManager));
  }
}
