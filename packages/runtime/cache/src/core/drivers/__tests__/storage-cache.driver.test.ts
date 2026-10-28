/**
 * Stackra file contract:
 * Purpose: unit tests of `StorageCacheDriver`: it is the `Cache` port, it keeps each entry in the storage `cache` area
 *          under `cache.` and the namespaced key with the lifetime as the area's time-to-live, it serves a value until
 *          its lifetime passes on the clock, `remember` loads once, `forget` drops the covered keys while the area's
 *          other keys stay, and `forgetTag` drops the tagged entries and their marker keys.
 * Boundary: test only; the storage is the real in-memory driver from `@stackra/storage/testing`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing; fakes are real drivers);
 *                     ADR 0150 (decisions 1, 2 and 4); ADR 0256 (decision 2).
 */
import { Clock, Duration } from "@stackra/contracts";
import { fakeStorage } from "@stackra/storage/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Cache } from "#contracts/ports/cache.port";
import { CacheKey } from "#core/constants/cache-key.constant";
import { NoneCacheMetricsDriver } from "#core/drivers/none-cache-metrics.driver";
import { SharedCacheNamespaceDriver } from "#core/drivers/shared-cache-namespace.driver";
import { StorageCacheDriver } from "#core/drivers/storage-cache.driver";

class ManualClock extends Clock {
  time = Date.parse("2026-10-24T09:00:00.000Z");

  now(): Date {
    return new Date(this.time);
  }
}

class Product {}

class Category {}

const TEN_MINUTES = Duration.minutes(10);

/** A driver over a fresh in-memory storage. */
function setup(): {
  cache: StorageCacheDriver;
  storage: ReturnType<typeof fakeStorage>;
  clock: ManualClock;
} {
  const storage = fakeStorage();
  const clock = new ManualClock();
  return {
    cache: new StorageCacheDriver(
      storage,
      new SharedCacheNamespaceDriver(),
      clock,
      new NoneCacheMetricsDriver(),
    ),
    storage,
    clock,
  };
}

describe("StorageCacheDriver", () => {
  it("is a driver of the Cache port", () => {
    expect(setup().cache).toBeInstanceOf(Cache);
  });

  it("keeps each entry in the cache area under its prefix, with the lifetime as its time-to-live", async () => {
    const { cache, storage } = setup();
    const set = vi.spyOn(storage.cache, "set");
    await cache.put(CacheKey.of(Product, "prd_1"), { id: "prd_1" }, TEN_MINUTES);
    expect(storage.cache.keys()).toEqual(["cache./Product:prd_1"]);
    expect(set).toHaveBeenCalledWith("cache./Product:prd_1", expect.any(String), {
      ttl: TEN_MINUTES,
    });
  });

  it("serves a value until its lifetime passes on the clock", async () => {
    const { cache, clock } = setup();
    const key = CacheKey.of(Product, "prd_1");
    await cache.put(key, { id: "prd_1" }, TEN_MINUTES);
    await expect(cache.get(key)).resolves.toEqual({ id: "prd_1" });
    clock.time += Duration.toMilliseconds(TEN_MINUTES);
    await expect(cache.get(key)).resolves.toBeUndefined();
  });

  it("remembers a load", async () => {
    const { cache } = setup();
    const key = CacheKey.of(Product, "prd_1", "en");
    const load = vi.fn(async () => "view");
    await cache.remember(key, TEN_MINUTES, load);
    await expect(cache.remember(key, TEN_MINUTES, load)).resolves.toBe("view");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("forgets the covered keys and leaves the area's other keys", async () => {
    const { cache, storage } = setup();
    storage.cache.set("query.page_1", [1]);
    await cache.put(CacheKey.of(Product, "prd_1", "en"), "en", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_10"), "other", TEN_MINUTES);
    await cache.forget(CacheKey.of(Product, "prd_1"));
    expect(storage.cache.keys().sort()).toEqual(["cache./Product:prd_10", "query.page_1"]);
  });
  it("forgets a tag's entries and its marker keys, leaving the rest", async () => {
    const { cache, storage } = setup();
    const tag = CacheKey.of(Category, "cat_1");
    await cache.put(CacheKey.of(Product, "prd_1"), "one", TEN_MINUTES, { tags: [tag] });
    await cache.put(CacheKey.of(Product, "prd_2"), "two", TEN_MINUTES);
    expect(storage.cache.keys().sort()).toEqual([
      `cache.#${encodeURIComponent("t//Category:cat_1")}//Product:prd_1`,
      "cache./Product:prd_1",
      "cache./Product:prd_2",
    ]);
    await cache.forgetTag(tag);
    expect(storage.cache.keys()).toEqual(["cache./Product:prd_2"]);
  });
});
