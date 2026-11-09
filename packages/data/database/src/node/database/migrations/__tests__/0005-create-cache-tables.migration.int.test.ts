/**
 * Stackra file contract:
 * Purpose: integration tests of `CreateCacheTablesMigration` with the `postgres` cache driver on real Postgres: the
 *          migrated tables are unlogged with no row-level security, the driver stores, reads, forgets and drops by tag
 *          on them, the driver never creates a table (a schema the migration did not make rejects the call and stays
 *          absent), and the migration runs over tables `postgresCacheTables("cache")` made earlier and keeps their
 *          rows.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0005 migration creates the tables.
 *           `CacheSql` here runs each statement on a forked entity manager, outside any transaction.
 * Runtime: node (vitest)
 * Governing contract: ADR 0150 (decision 1); ADR 0159 (as amended); ADR 0210 (2026-10-24 amendment); ADR 0022; ADR
 *                     0269.
 */
import { buildConfig } from "@stackra/config";
import {
  CacheConfig,
  CacheKey,
  LocalCacheLockDriver,
  NoneCacheMetricsDriver,
  SharedCacheNamespaceDriver,
} from "@stackra/cache";
import { CacheSql } from "@stackra/cache/contracts";
import { PostgresCacheDriver, postgresCacheTables } from "@stackra/cache/node";
import { Driver, SystemClockDriver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { compileMigration } from "#core/functions/compile-migration.function";
import { CreateCacheTablesMigration } from "#node/database/migrations/0005-create-cache-tables.migration";
import { usePostgres } from "#testing/use-postgres";

const migration = compileMigration(CreateCacheTablesMigration, {
  schema: "database",
  createsSchema: true,
});

const postgres = usePostgres({ entities: [], migrations: [migration] });

/** Runs the driver's statements on the test database, each on its own. */
class TestCacheSql extends Driver(CacheSql) {
  async query(
    sql: string,
    params: readonly unknown[],
  ): Promise<readonly Record<string, unknown>[]> {
    return (await postgres.database
      .em()
      .fork()
      .execute(sql, [...params])) as unknown as readonly Record<string, unknown>[];
  }
}

/** A Postgres cache driver over the tables in `schema`. */
function driver(schema = "cache"): PostgresCacheDriver {
  return new PostgresCacheDriver(
    buildConfig(CacheConfig, { values: { driver: "postgres", postgres: { schema, sweep: 100 } } }),
    new TestCacheSql(),
    new SharedCacheNamespaceDriver(),
    new SystemClockDriver(),
    new LocalCacheLockDriver(),
    new NoneCacheMetricsDriver(),
  );
}

/** Runs `statement` on the test database and answers its rows. */
async function rows(statement: string): Promise<readonly Record<string, unknown>[]> {
  // raw-sql: catalog reads and test setup
  return new TestCacheSql().query(statement, []);
}

class Product {}

class Category {}

const TEN_MINUTES = Duration.minutes(10);

describe(CreateCacheTablesMigration, () => {
  it("makes unlogged tables with no row-level security", async () => {
    expect(
      await rows(
        "select relname, relpersistence, relrowsecurity from pg_class " +
          "where relnamespace = 'cache'::regnamespace and relkind = 'r' order by relname",
      ),
    ).toEqual([
      { relname: "entries", relpersistence: "u", relrowsecurity: false },
      { relname: "set_members", relpersistence: "u", relrowsecurity: false },
    ]);
  });

  it("serves the postgres cache driver: put, get, forget and forgetTag", async () => {
    const cache = driver();
    const one = CacheKey.of(Product, "prd_1");
    const two = CacheKey.of(Product, "prd_2");
    await cache.put(one, { id: "prd_1" }, TEN_MINUTES, { tags: [CacheKey.of(Category, "cat_1")] });
    await cache.put(two, { id: "prd_2" }, TEN_MINUTES);
    await expect(cache.get(one)).resolves.toEqual({ id: "prd_1" });
    await cache.forgetTag(CacheKey.of(Category, "cat_1"));
    await expect(cache.get(one)).resolves.toBeUndefined();
    await expect(cache.get(two)).resolves.toEqual({ id: "prd_2" });
    await cache.forget(two);
    await expect(cache.get(two)).resolves.toBeUndefined();
  });

  it("never creates a table: a schema the migration did not make rejects the call and stays absent", async () => {
    await expect(
      driver("absent").put(CacheKey.of(Product, "prd_3"), 1, TEN_MINUTES),
    ).rejects.toThrow(/does not exist/);
    expect(await rows("select to_regnamespace('absent') as schema")).toEqual([{ schema: null }]);
  });

  it("runs over tables postgresCacheTables made earlier and keeps their rows", async () => {
    await rows('drop table "cache"."entries", "cache"."set_members"');
    for (const { statement } of postgresCacheTables("cache")) await rows(statement);
    const key = CacheKey.of(Product, "prd_4");
    await driver().put(key, { id: "prd_4" }, TEN_MINUTES);
    for (const step of migration.steps) for (const statement of step.sql) await rows(statement);
    await expect(driver().get(key)).resolves.toEqual({ id: "prd_4" });
  });
});
