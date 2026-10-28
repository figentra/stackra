/**
 * Stackra file contract:
 * Purpose: the `CacheSql` port: the Postgres connection the `postgres` cache driver runs its statements on, one
 *          parameterised statement per call, answering the rows.
 * Boundary: an abstract class that is its own token, keyed `cache.CacheSql`. @stackra/database binds it over the
 *           service's `Database` (this package cannot depend on @stackra/database: that package already reaches this
 *           one through @stackra/actions). A driver runs each statement on its own, outside the caller's transaction,
 *           so a cache write never waits for or rolls back with the caller's work. Placeholders are `?`, every value is
 *           bound; the statement text comes from `PostgresCacheDriver` only, never from a caller.
 * Runtime: node
 * Governing contract: ADR 0150 (decision 1: the Postgres driver); ADR 0160 (raw SQL is parameterised); ADR 0294
 *                     (decisions 4, 15 and 16); STA-1438.
 */
import { Port } from "@stackra/contracts";

/**
 * Runs the Postgres cache driver's statements.
 *
 * @example
 * // @stackra/database
 * export class DatabaseCacheSqlDriver extends Driver(CacheSql) {
 *   query(sql: string, params: readonly unknown[]): Promise<readonly Record<string, unknown>[]> {
 *     return this.database.em().fork().getConnection().execute(sql, [...params]);
 *   }
 * }
 */
export abstract class CacheSql extends Port {
  /** Type-only port key. */
  declare readonly "~key": "cache.CacheSql";

  /** Runs `sql` with `params` bound to its `?` placeholders, outside any running transaction, and answers its rows. */
  abstract query(
    sql: string,
    params: readonly unknown[],
  ): Promise<readonly Record<string, unknown>[]>;
}
