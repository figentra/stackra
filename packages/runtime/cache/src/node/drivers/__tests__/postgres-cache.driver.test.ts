/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresCacheDriver`: it is the `Cache` port, every statement names the configured schema and
 *          binds every value, it upserts an entry with the instant its row may go and reads it back until the lifetime
 *          passes on the clock, `forget` drops only the covered keys through an escaped prefix `like`, `forgetTag` drops
 *          the tagged entries and the tag's members, `remember` loads once, a write sweeps at most `postgres.sweep`
 *          dead rows (none at `0`), and a failed statement rejects the call.
 * Boundary: test only; `CacheSql` is an in-memory fake that runs the driver's statements over two maps.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0150 (decisions 1, 2
 *                     and 4); ADR 0160 (raw SQL is parameterised); STA-1438.
 */
import { buildConfig } from "@stackra/config";
import { Driver } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CacheConfig } from "#config/cache.config";
import { Cache } from "#contracts/ports/cache.port";
import { CacheSql } from "#contracts/ports/cache-sql.port";
import { CacheKey } from "#core/constants/cache-key.constant";
import { LocalCacheLockDriver } from "#core/drivers/local-cache-lock.driver";
import { NoneCacheMetricsDriver } from "#core/drivers/none-cache-metrics.driver";
import { SharedCacheNamespaceDriver } from "#core/drivers/shared-cache-namespace.driver";
import { PostgresCacheDriver } from "#node/drivers/postgres-cache.driver";

/** A `like` pattern with `\` as its escape, as a regular expression. */
function likeOf(pattern: string): RegExp {
  let source = "";
  for (let index = 0; index < pattern.length; index += 1) {
    let char = pattern.charAt(index);
    if (char === "%") {
      source += ".*";
      continue;
    }
    if (char === "_") {
      source += ".";
      continue;
    }
    if (char === "\\") {
      index += 1;
      char = pattern.charAt(index);
    }
    source += char.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${source}$`, "s");
}

/** Runs the driver's statements over two maps, recording each one. */
class MapCacheSql extends Driver(CacheSql) {
  readonly entries = new Map<string, { body: string; expiresAt: Date }>();

  readonly members = new Map<string, Map<string, Date>>();

  readonly statements: [string, readonly unknown[]][] = [];

  failNext = false;

  async query(
    sql: string,
    params: readonly unknown[],
  ): Promise<readonly Record<string, unknown>[]> {
    this.statements.push([sql, params]);
    if (this.failNext) {
      this.failNext = false;
      throw new Error("connection refused");
    }
    const [first, second, third] = params;
    if (sql.startsWith("select body from"))
      return this.entries.has(String(first))
        ? [{ body: this.entries.get(String(first))?.body }]
        : [];
    if (sql.startsWith("insert into") && sql.includes('."entries"')) {
      this.entries.set(String(first), { body: String(second), expiresAt: third as Date });
      return [];
    }
    if (sql.startsWith("delete from") && sql.includes("ctid")) {
      const table = sql.includes('."entries"') ? "entries" : "members";
      const now = (first as Date).getTime();
      let left = Number(second);
      if (table === "entries")
        for (const [key, row] of this.entries)
          if (left > 0 && row.expiresAt.getTime() <= now) {
            this.entries.delete(key);
            left -= 1;
          }
      return [];
    }
    if (sql.startsWith("delete from") && sql.includes('."entries"')) {
      this.entries.delete(String(first));
      return [];
    }
    if (sql.startsWith("select key from")) {
      const like = likeOf(String(first));
      return [...this.entries.keys()].filter((key) => like.test(key)).map((key) => ({ key }));
    }
    if (sql.startsWith("insert into") && sql.includes('."set_members"')) {
      const set = this.members.get(String(first)) ?? new Map<string, Date>();
      set.set(String(second), third as Date);
      this.members.set(String(first), set);
      return [];
    }
    if (sql.startsWith("select member from"))
      return [...(this.members.get(String(first))?.keys() ?? [])].map((member) => ({ member }));
    if (sql.startsWith("delete from") && sql.includes('."set_members"')) {
      this.members.delete(String(first));
      return [];
    }
    throw new Error(`unexpected statement: ${sql}`);
  }
}

class ManualClock extends Clock {
  time = Date.parse("2026-10-28T09:00:00.000Z");

  now(): Date {
    return new Date(this.time);
  }
}

class Product {}

class Category {}

const TEN_MINUTES = Duration.minutes(10);

/** A driver over a fresh fake, with `postgres` config `postgres`. */
function setup(postgres: { schema?: string; sweep?: number } = {}): {
  cache: PostgresCacheDriver;
  sql: MapCacheSql;
  clock: ManualClock;
} {
  const sql = new MapCacheSql();
  const clock = new ManualClock();
  const config = buildConfig(CacheConfig, {
    values: { driver: "postgres", postgres: { schema: "cache", sweep: 100, ...postgres } },
  });
  const cache = new PostgresCacheDriver(
    config,
    sql,
    new SharedCacheNamespaceDriver(),
    clock,
    new LocalCacheLockDriver(),
    new NoneCacheMetricsDriver(),
  );
  return { cache, sql, clock };
}

describe("PostgresCacheDriver", () => {
  it("is a driver of the Cache port", () => {
    expect(setup().cache).toBeInstanceOf(Cache);
  });

  it("upserts an entry in the configured schema with the instant its row may go, and reads it until it expires", async () => {
    const { cache, sql, clock } = setup({ schema: "database" });
    const key = CacheKey.of(Product, "prd_1");
    await cache.put(key, { id: "prd_1" }, TEN_MINUTES);
    const [statement, params] = sql.statements[0] ?? ["", []];
    expect(statement).toContain(
      'insert into "database"."entries" (key, body, expires_at) values (?, ?, ?)',
    );
    expect(params).toEqual(["/Product:prd_1", expect.any(String), new Date(clock.time + 600_000)]);
    await expect(cache.get(key)).resolves.toEqual({ id: "prd_1" });
    clock.time += Duration.toMilliseconds(TEN_MINUTES);
    await expect(cache.get(key)).resolves.toBeUndefined();
  });

  it("binds every value: no key, text or instant appears in a statement", async () => {
    const { cache, sql } = setup();
    await cache.put(CacheKey.of(Product, "it's"), "o'clock", TEN_MINUTES, {
      tags: [CacheKey.of(Category, "x")],
    });
    await cache.forget(CacheKey.of(Product));
    for (const [statement] of sql.statements) {
      expect(statement).not.toContain("it's");
      expect(statement).not.toContain("o'clock");
      expect(statement).not.toContain("Category");
      expect(statement).not.toContain("2026");
    }
  });

  it("forgets every covered key through an escaped prefix match, and nothing else", async () => {
    const { cache, sql } = setup();
    await cache.put(CacheKey.of(Product, "prd_1"), "base", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_1", "en"), "en", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_10"), "other", TEN_MINUTES);
    sql.entries.set("/ProductX", { body: "lookalike", expiresAt: new Date(8.64e15) });
    await cache.forget(CacheKey.of(Product, "prd_1"));
    expect([...sql.entries.keys()].sort()).toEqual(["/Product:prd_10", "/ProductX"]);
    expect(sql.statements).toContainEqual([
      `select key from "cache"."entries" where key like ? escape '\\'`,
      ["/Product:prd\\_1%"],
    ]);
  });

  it("forgets the entries carrying a tag and the tag's members", async () => {
    const { cache, sql } = setup();
    const tag = CacheKey.of(Category, "cat_1");
    await cache.put(CacheKey.of(Product, "prd_1"), "one", TEN_MINUTES, { tags: [tag] });
    await cache.put(CacheKey.of(Product, "prd_2"), "two", TEN_MINUTES);
    expect(sql.members.get("t//Category:cat_1")).toBeDefined();
    await cache.forgetTag(tag);
    await expect(cache.get(CacheKey.of(Product, "prd_1"))).resolves.toBeUndefined();
    await expect(cache.get(CacheKey.of(Product, "prd_2"))).resolves.toBe("two");
    expect(sql.members.has("t//Category:cat_1")).toBe(false);
  });

  it("remembers a load", async () => {
    const { cache } = setup();
    const load = vi.fn(async () => "view");
    await cache.remember(CacheKey.of(Product, "prd_1"), TEN_MINUTES, load);
    await expect(cache.remember(CacheKey.of(Product, "prd_1"), TEN_MINUTES, load)).resolves.toBe(
      "view",
    );
    expect(load).toHaveBeenCalledOnce();
  });

  it("sweeps at most postgres.sweep dead rows per write, and none at zero", async () => {
    const swept = setup({ sweep: 1 });
    await swept.cache.put(CacheKey.of(Product, "a"), 1, Duration.seconds(1));
    await swept.cache.put(CacheKey.of(Product, "b"), 2, Duration.seconds(1));
    swept.clock.time += 1000;
    await swept.cache.put(CacheKey.of(Product, "c"), 3, TEN_MINUTES);
    expect(swept.sql.entries.size).toBe(2);
    expect(swept.sql.statements.at(-1)?.[1]).toEqual([new Date(swept.clock.time), 1]);
    const kept = setup({ sweep: 0 });
    await kept.cache.put(CacheKey.of(Product, "a"), 1, TEN_MINUTES);
    expect(kept.sql.statements.some(([statement]) => statement.includes("ctid"))).toBe(false);
  });

  it("rejects the call when a statement fails", async () => {
    const { cache, sql } = setup();
    sql.failNext = true;
    await expect(cache.get(CacheKey.of(Product, "prd_1"))).rejects.toThrow("connection refused");
  });
});
