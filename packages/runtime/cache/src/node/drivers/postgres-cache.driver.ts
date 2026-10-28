/**
 * Stackra file contract:
 * Purpose: the Postgres driver of the `Cache` port (`driver: "postgres"`), for on-prem and air-gapped services with no
 *          Valkey: entries in the unlogged table `<postgres.schema>.entries`, tag members in `set_members`, shared by
 *          every instance of the member through the service's own database, with tags, stale-while-revalidate and,
 *          through `CacheLock`, one load across instances.
 * Boundary: statements go through the `CacheSql` port, which @stackra/database binds; each runs on its own, outside the
 *           caller's transaction, with every value bound (ADR 0160). Each entry is JSON with its expiry on the `Clock`;
 *           the row's `expires_at` (the end of its stale window) only lets a sweep reclaim it: each entry write sweeps
 *           up to `postgres.sweep` dead entries, and each tag add as many dead members. `forget` lists the covered keys with a prefix `like` on the
 *           "C"-collated primary key, so it reads the index, never the whole table. The tables are unlogged: a crash
 *           empties them and a read replica does not see them, which a cache allows. Single-flight is per process. A
 *           failed statement rejects the call.
 * Runtime: node
 * Governing contract: ADR 0150 (decisions 1, 2 and 4); ADR 0076 (on-prem); ADR 0160 (raw SQL is parameterised);
 *                     ADR 0305 (rule 32); STA-1438.
 */
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";

import type { CacheConfig } from "#config/cache.config";
import { Cache } from "#contracts/ports/cache.port";
import type { CacheLock } from "#contracts/ports/cache-lock.port";
import type { CacheMetrics } from "#contracts/ports/cache-metrics.port";
import type { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import type { CacheSql } from "#contracts/ports/cache-sql.port";
import type { CacheKey } from "#contracts/types/cache-key.type";
import type { CachePutOptions } from "#contracts/types/cache-put-options.type";
import type { CacheRememberOptions } from "#contracts/types/cache-remember-options.type";
import { storedCache } from "#core/functions/stored-cache.function";
import { textEntryStore } from "#core/functions/text-entry-store.function";
import type { CacheOperations } from "#core/types/cache-operations.type";

/** `text` with the `like` wildcards and the escape character escaped, so it matches only itself. */
function literal(text: string): string {
  return text.replaceAll(/[\\%_]/g, "\\$&");
}

/**
 * Keeps values in Postgres.
 *
 * @example
 * // runway.yaml (on-prem): config.cache: { driver: postgres, lock: locks }
 * await cache.remember(CacheKey.of(Product, id), Duration.minutes(10), () => this.load(id));
 */
export class PostgresCacheDriver extends Driver(Cache) {
  private readonly cache: CacheOperations;

  /**
   * @param config - the tables' schema and sweep size (`postgres`), the lifetime jitter and the fill wait.
   * @param sql - the connection the statements run on; @stackra/database binds it.
   * @param namespace - the prefix of every key; the shared namespace unless config `cache.namespace` selects another.
   * @param clock - the time source of expiry.
   * @param lock - guards a `remember(..., { lock: true })` fill across instances; config `cache.lock` picks it.
   * @param metrics - where hits, misses, loads and evictions go; config `cache.metrics` picks it.
   */
  constructor(
    config: CacheConfig,
    sql: CacheSql,
    namespace: CacheNamespace,
    clock: Clock,
    lock: CacheLock,
    metrics: CacheMetrics,
  ) {
    super();
    const { schema, sweep } = config.postgres;
    const entries = `"${schema}"."entries"`;
    const members = `"${schema}"."set_members"`;
    /** The instant `ttl` from now on the clock. */
    const until = (ttl: Duration): Date =>
      new Date(clock.now().getTime() + Math.ceil(Duration.toMilliseconds(ttl)));
    /** Deletes up to `sweep` rows of `table` that are past their instant. */
    const reclaim = async (table: string): Promise<void> => {
      if (sweep === 0) return;
      // raw-sql: a bounded delete of dead rows has no ORM form without a model (ADR 0160)
      await sql.query(
        `delete from ${table} where ctid in (select ctid from ${table} where expires_at <= ? order by expires_at limit ?)`,
        [clock.now(), sweep],
      );
    };
    this.cache = storedCache(
      textEntryStore({
        read: async (key) => {
          // raw-sql: a read by primary key of a table no model maps (ADR 0160)
          const [row] = await sql.query(`select body from ${entries} where key = ?`, [key]);
          return typeof row?.["body"] === "string" ? row["body"] : undefined;
        },
        write: async (key, text, ttl) => {
          // raw-sql: an upsert has no ORM form without a model (ADR 0160)
          await sql.query(
            `insert into ${entries} (key, body, expires_at) values (?, ?, ?) ` +
              "on conflict (key) do update set body = excluded.body, expires_at = excluded.expires_at",
            [key, text, until(ttl)],
          );
          await reclaim(entries);
        },
        delete: async (key) => {
          // raw-sql: a delete by primary key (ADR 0160)
          await sql.query(`delete from ${entries} where key = ?`, [key]);
        },
        keys: async (prefix) => {
          // raw-sql: a prefix match on the "C"-collated primary key, the wildcards escaped (ADR 0160)
          const rows = await sql.query(`select key from ${entries} where key like ? escape '\\'`, [
            `${literal(prefix)}%`,
          ]);
          return rows
            .map((row) => row["key"])
            .filter((key): key is string => typeof key === "string");
        },
        add: async (set, member, ttl) => {
          // raw-sql: an upsert keeping the later instant (ADR 0160)
          await sql.query(
            `insert into ${members} (set_name, member, expires_at) values (?, ?, ?) ` +
              `on conflict (set_name, member) do update set expires_at = greatest(${members}.expires_at, excluded.expires_at)`,
            [set, member, until(ttl)],
          );
          await reclaim(members);
        },
        members: async (set) => {
          // raw-sql: the members of one set by the primary key's prefix (ADR 0160)
          const rows = await sql.query(`select member from ${members} where set_name = ?`, [set]);
          return rows
            .map((row) => row["member"])
            .filter((member): member is string => typeof member === "string");
        },
        clear: async (set) => {
          // raw-sql: a delete by the primary key's prefix (ADR 0160)
          await sql.query(`delete from ${members} where set_name = ?`, [set]);
        },
      }),
      namespace,
      clock,
      { jitter: config.jitter, fill: config.fill, lock, metrics },
    );
  }

  /** The value stored under `key`, or `undefined` when none is stored or it is no longer fresh. */
  get<T>(key: CacheKey): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  /** Stores `value` under `key` for `ttl` with its tags; a zero `ttl` stores nothing. A load in flight is not stored. */
  put<T>(key: CacheKey, value: T, ttl: Duration, options?: CachePutOptions): Promise<void> {
    return this.cache.put(key, value, ttl, options);
  }

  /** The stored value, or the result of `load` stored for `ttl`; concurrent calls for one key share one `load`. */
  remember<T>(
    key: CacheKey,
    ttl: Duration,
    load: () => T | Promise<T>,
    options?: CacheRememberOptions,
  ): Promise<T> {
    return this.cache.remember(key, ttl, load, options);
  }

  /** Drops `key` and every key it covers; a covered load in flight answers its callers but is not stored. */
  forget(key: CacheKey): Promise<void> {
    return this.cache.forget(key);
  }

  /** Drops every entry of this namespace carrying `tag`; a tagged load in flight is not stored. */
  forgetTag(tag: CacheKey): Promise<void> {
    return this.cache.forgetTag(tag);
  }
}
