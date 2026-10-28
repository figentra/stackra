/**
 * Stackra file contract:
 * Purpose: unit tests of `ValkeyCacheDriver`: it is the `Cache` port, it refuses to start without the
 *          `CACHE_VALKEY_URL` secret, it connects to that URL with one retry per command, it writes each entry under
 *          the key prefix with `PX` milliseconds, reads it back until the lifetime passes on the clock, indexes each key
 *          in a sorted set under every key that covers it (dropping members past their instant, keeping the set alive
 *          for its longest member), `forget` drops only the covered keys from that set without a `SCAN`, and
 *          `forgetTag` drops the tagged entries.
 * Boundary: test only; `iovalkey` is mocked by an in-memory client (strings and sorted sets), so no server runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0150 (decisions 1, 2
 *                     and 4); ADR 0173 (secrets by name).
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Clock, Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CacheConfig } from "#config/cache.config";
import { Cache } from "#contracts/ports/cache.port";
import { CacheKey } from "#core/constants/cache-key.constant";
import { LocalCacheLockDriver } from "#core/drivers/local-cache-lock.driver";
import { NoneCacheMetricsDriver } from "#core/drivers/none-cache-metrics.driver";
import { SharedCacheNamespaceDriver } from "#core/drivers/shared-cache-namespace.driver";
import { ValkeyCacheDriver } from "#node/drivers/valkey-cache.driver";

/** The in-memory server the mocked client talks to, and what the client was built with. */
const server = vi.hoisted(() => ({
  values: new Map<string, string>(),
  sets: new Map<string, Map<string, number>>(),
  expiries: [] as unknown[][],
  options: [] as unknown[],
}));

vi.mock("iovalkey", () => ({
  default: class {
    get = vi.fn(async (key: string) => server.values.get(key) ?? null);

    set = vi.fn(async (key: string, value: string) => {
      server.values.set(key, value);
      return "OK";
    });

    del = vi.fn(async (key: string) => {
      const had = server.values.delete(key) || server.sets.delete(key);
      return had ? 1 : 0;
    });

    zadd = vi.fn(async (key: string, _gt: string, score: number, member: string) => {
      const set = server.sets.get(key) ?? new Map<string, number>();
      set.set(member, Math.max(score, set.get(member) ?? Number.NEGATIVE_INFINITY));
      server.sets.set(key, set);
      return 1;
    });

    zremrangebyscore = vi.fn(async (key: string, _min: string, max: number) => {
      const set = server.sets.get(key);
      for (const [member, score] of set ?? []) if (score <= max) set?.delete(member);
      return 0;
    });

    zrange = vi.fn(async (key: string) => [...(server.sets.get(key)?.keys() ?? [])]);

    pexpire = vi.fn(async (...args: unknown[]) => {
      server.expiries.push(args);
      return 1;
    });

    scan = vi.fn();

    constructor(...args: unknown[]) {
      server.options.push(args);
    }
  },
}));

class ManualClock extends Clock {
  time = Date.parse("2026-10-24T09:00:00.000Z");

  now(): Date {
    return new Date(this.time);
  }
}

/** A secret store holding only `CACHE_VALKEY_URL`. */
class ValkeySecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "CACHE_VALKEY_URL" ? "redis://:pw@valkey.test:6379" : undefined;
  }
}

class Product {}

class Category {}

/** A driver over `config` with the shared namespace, the local lock and no metrics. */
function driver(config: CacheConfig, clock: Clock): ValkeyCacheDriver {
  return new ValkeyCacheDriver(
    config,
    new SharedCacheNamespaceDriver(),
    clock,
    new LocalCacheLockDriver(),
    new NoneCacheMetricsDriver(),
  );
}

const TEN_MINUTES = Duration.minutes(10);

/** A driver over a fresh server, with the prefix `keyPrefix`. */
function setup(keyPrefix = "commerce:"): { cache: ValkeyCacheDriver; clock: ManualClock } {
  server.values.clear();
  server.sets.clear();
  server.expiries.length = 0;
  server.options.length = 0;
  const clock = new ManualClock();
  const config = buildConfig(CacheConfig, {
    values: { driver: "valkey", valkey: { keyPrefix } },
    secrets: new ValkeySecrets(),
  });
  return { cache: driver(config, clock), clock };
}

describe("ValkeyCacheDriver", () => {
  it("is a driver of the Cache port, connected to the secret URL with one retry per command", () => {
    expect(setup().cache).toBeInstanceOf(Cache);
    expect(server.options).toEqual([["redis://:pw@valkey.test:6379", { maxRetriesPerRequest: 1 }]]);
  });

  it("refuses to start without the CACHE_VALKEY_URL secret", () => {
    const config = buildConfig(CacheConfig, { values: { driver: "valkey" } });
    expect(() => driver(config, new ManualClock())).toThrow(/CACHE_VALKEY_URL/);
  });

  it("writes under the key prefix with PX milliseconds and reads back until the lifetime passes", async () => {
    const { cache, clock } = setup();
    const key = CacheKey.of(Product, "prd_1");
    await cache.put(key, { id: "prd_1" }, TEN_MINUTES);
    expect(cache.client.set).toHaveBeenCalledWith(
      "commerce:/Product:prd_1",
      expect.any(String),
      "PX",
      600_000,
    );
    await expect(cache.get(key)).resolves.toEqual({ id: "prd_1" });
    clock.time += Duration.toMilliseconds(TEN_MINUTES);
    await expect(cache.get(key)).resolves.toBeUndefined();
  });

  it("indexes each key under the keys that cover it, with its instant and the set's lifetime", async () => {
    const { cache, clock } = setup();
    await cache.put(CacheKey.of(Product, "prd_1", "en"), "en", TEN_MINUTES);
    expect([...(server.sets.get("commerce:#k//Product:prd_1") ?? [])]).toEqual([
      ["/Product:prd_1:en", clock.time + 600_000],
    ]);
    expect(server.sets.has("commerce:#k//Product")).toBe(true);
    expect(server.expiries).toContainEqual(["commerce:#k//Product", 600_000, "NX"]);
    expect(server.expiries).toContainEqual(["commerce:#k//Product", 600_000, "GT"]);
  });

  it("drops members past their instant when the set is written again", async () => {
    const { cache, clock } = setup();
    await cache.put(CacheKey.of(Product, "prd_1", "en"), "en", Duration.seconds(1));
    clock.time += 1000;
    await cache.put(CacheKey.of(Product, "prd_2", "en"), "en", TEN_MINUTES);
    expect([...(server.sets.get("commerce:#k//Product")?.keys() ?? [])]).toEqual([
      "/Product:prd_2:en",
    ]);
  });

  it("forgets every covered key from its index set, without a SCAN, and nothing else", async () => {
    const { cache } = setup();
    await cache.put(CacheKey.of(Product, "prd_1"), "base", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_1", "en"), "en", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_1", "ar"), "ar", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_10"), "other", TEN_MINUTES);
    await cache.forget(CacheKey.of(Product, "prd_1"));
    expect([...server.values.keys()]).toEqual(["commerce:/Product:prd_10"]);
    expect(server.sets.has("commerce:#k//Product:prd_1")).toBe(false);
    expect(cache.client.scan).not.toHaveBeenCalled();
  });

  it("forgets the entries carrying a tag", async () => {
    const { cache } = setup();
    const tag = CacheKey.of(Category, "cat_1");
    await cache.put(CacheKey.of(Product, "prd_1"), "one", TEN_MINUTES, { tags: [tag] });
    await cache.put(CacheKey.of(Product, "prd_2"), "two", TEN_MINUTES);
    await cache.forgetTag(tag);
    await expect(cache.get(CacheKey.of(Product, "prd_1"))).resolves.toBeUndefined();
    await expect(cache.get(CacheKey.of(Product, "prd_2"))).resolves.toBe("two");
    expect(server.sets.has("commerce:#t//Category:cat_1")).toBe(false);
  });
});
