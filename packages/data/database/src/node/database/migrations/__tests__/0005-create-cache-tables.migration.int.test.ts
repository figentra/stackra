/**
 * Stackra file contract:
 * Purpose: integration tests of `CreateCacheTablesMigration` with the `postgres` cache driver on real Postgres: the
 *          migrated tables are unlogged with no row-level security, the driver stores, reads, forgets and drops by tag
 *          on them, the driver never creates a table (a schema the migration did not make rejects the call and stays
 *          absent), and the migration runs over tables `postgresCacheTables("cache")` made earlier and keeps their
 *          rows. Then the driver itself on those tables, as several instances share them: a value one instance put
 *          is read by another; a write sweeps dead entries and a tag add dead members; `forget` matches its prefix
 *          literally, so a namespace whose name differs only where `like` reads a wildcard (`_`) keeps its entries;
 *          concurrent tag adds keep the latest instant; `remember` serves a stale entry while one reload replaces it.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0005 migration creates the tables.
 *           `CacheSql` here runs each statement on a forked entity manager, outside any transaction. The driver tests
 *           sit here, not in @stackra/cache, because the tables are this package's migration and @stackra/cache never
 *           depends on this package.
 * Runtime: node (vitest)
 * Governing contract: ADR 0150 (decisions 1, 2 and 4); ADR 0159 (as amended); ADR 0210 (2026-10-24 amendment); ADR
 *                     0160; ADR 0022; ADR 0269; STA-2802.
 */
import { buildConfig } from "@stackra/config";
import {
  CacheConfig,
  CacheKey,
  LocalCacheLockDriver,
  NoneCacheMetricsDriver,
  SharedCacheNamespaceDriver,
} from "@stackra/cache";
import { CacheNamespace, CacheSql } from "@stackra/cache/contracts";
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

/** The namespace a scoped deployment's driver reads on every call; the test moves it between calls. */
class SettableCacheNamespace extends CacheNamespace {
  name = "";

  current(): string {
    return this.name;
  }
}

/** A Postgres cache driver over the tables in `schema`, in `namespace` (the shared one by default). */
function driver(
  schema = "cache",
  namespace: CacheNamespace = new SharedCacheNamespaceDriver(),
): PostgresCacheDriver {
  return new PostgresCacheDriver(
    buildConfig(CacheConfig, { values: { driver: "postgres", postgres: { schema, sweep: 100 } } }),
    new TestCacheSql(),
    namespace,
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

/** Resolves after `milliseconds`. */
const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

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

describe(PostgresCacheDriver, () => {
  it("serves a value one instance put to another", async () => {
    const key = CacheKey.of(Product, "prd_shared");
    await driver().put(key, { id: "prd_shared", price: 1250 }, TEN_MINUTES);
    await expect(driver().get(key)).resolves.toEqual({ id: "prd_shared", price: 1250 });
  });

  it("sweeps dead entries on a write and dead members on a tag add", async () => {
    const tag = CacheKey.of(Category, "cat_sweep");
    for (let index = 0; index < 5; index += 1)
      // oxlint-disable-next-line no-await-in-loop -- seeds the entries one after another
      await driver().put(CacheKey.of(Product, `prd_dead_${index}`), index, Duration.parse("50ms"), {
        tags: [tag],
      });
    await sleep(150);
    await driver().put(CacheKey.of(Product, "prd_live"), "live", TEN_MINUTES, { tags: [tag] });
    expect(
      await rows("select count(*)::int as dead from cache.entries where expires_at <= now()"),
    ).toEqual([{ dead: 0 }]);
    expect(
      await rows("select count(*)::int as dead from cache.set_members where expires_at <= now()"),
    ).toEqual([{ dead: 0 }]);
    await expect(driver().get(CacheKey.of(Product, "prd_live"))).resolves.toBe("live");
  });

  it("forgets by a literal prefix, so a namespace differing only at a like wildcard keeps its entries", async () => {
    const namespace = new SettableCacheNamespace();
    const cache = driver("cache", namespace);
    const key = CacheKey.of(Product, "prd_like", "en");
    namespace.name = "scp_a";
    await cache.put(key, "underscore", TEN_MINUTES);
    namespace.name = "scpxa";
    await cache.put(key, "letter", TEN_MINUTES);
    namespace.name = "scp_a";
    await cache.forget(CacheKey.of(Product, "prd_like"));
    await expect(cache.get(key)).resolves.toBeUndefined();
    namespace.name = "scpxa";
    await expect(cache.get(key)).resolves.toBe("letter");
  });

  it("keeps the latest instant when instances add one member to a tag at once", async () => {
    const tag = CacheKey.of(Category, "cat_race");
    const key = CacheKey.of(Product, "prd_race");
    await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        driver().put(key, index, Duration.minutes(index + 1), { tags: [tag] }),
      ),
    );
    const [row] = await rows(
      "select count(*)::int as members, bool_and(expires_at > now() + interval '9 minutes') as latest " +
        "from cache.set_members where member like '%prd_race%' and set_name like '%cat_race%'",
    );
    expect(row).toEqual({ members: 1, latest: true });
    await driver().forgetTag(tag);
    await expect(driver().get(key)).resolves.toBeUndefined();
  });

  it("serves a stale entry inside its window while one reload replaces it", async () => {
    const cache = driver();
    const key = CacheKey.of(Product, "prd_stale");
    const options = { stale: Duration.seconds(30) };
    await cache.remember(key, Duration.parse("100ms"), () => "first", options);
    await sleep(250);
    let reloads = 0;
    const reload = async (): Promise<string> => {
      reloads += 1;
      await sleep(50);
      return "second";
    };
    const served = await Promise.all([
      cache.remember(key, TEN_MINUTES, reload, options),
      cache.remember(key, TEN_MINUTES, reload, options),
    ]);
    expect(served).toEqual(["first", "first"]);
    await sleep(200);
    expect(reloads).toBe(1);
    await expect(driver().get(key)).resolves.toBe("second");
  });
});
