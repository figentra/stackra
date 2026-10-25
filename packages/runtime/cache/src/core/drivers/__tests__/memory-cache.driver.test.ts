/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryCacheDriver`: get and put, expiry on the clock, a zero lifetime, single-flight
 *          `remember` (one load for concurrent calls, nothing stored on rejection or a synchronous throw), `forget` of a
 *          key and every key it covers (the template's every-locale forget), a covered load in flight not stored, a
 *          `put` winning over a load in flight, namespace isolation, and the least-recently-read bound.
 * Boundary: test only; builds `CacheConfig` through `buildConfig` as the runtime does, with a settable clock and a
 *           settable namespace.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0150 (decisions 1, 2
 *                     and 4); ADR 0305 (rule 32).
 */
import { buildConfig } from "@stackra/config";
import { Clock, Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CacheConfig } from "#config/cache.config";
import { Cache } from "#contracts/ports/cache.port";
import { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import { CacheKey } from "#core/constants/cache-key.constant";
import { MemoryCacheDriver } from "#core/drivers/memory-cache.driver";

class ManualClock extends Clock {
  time = Date.parse("2026-10-24T09:00:00.000Z");

  now(): Date {
    return new Date(this.time);
  }
}

class SettableCacheNamespace extends CacheNamespace {
  name = "";

  current(): string {
    return this.name;
  }
}

class Product {}

/** A driver bounded at `maxEntries`, with its clock and namespace. */
function setup(maxEntries = 100): {
  cache: MemoryCacheDriver;
  clock: ManualClock;
  namespace: SettableCacheNamespace;
} {
  const clock = new ManualClock();
  const namespace = new SettableCacheNamespace();
  const cache = new MemoryCacheDriver(
    buildConfig(CacheConfig, { values: { maxEntries } }),
    namespace,
    clock,
  );
  return { cache, clock, namespace };
}

/** Stands in for `resolve` until the promise executor sets it. */
const UNSET = (): void => undefined;

/** A promise with its resolve in hand; the executor runs synchronously, so `resolve` is set on return. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve: (value: T) => void = UNSET;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

const TEN_MINUTES = Duration.minutes(10);

describe("MemoryCacheDriver", () => {
  it("is a driver of the Cache port", () => {
    expect(setup().cache).toBeInstanceOf(Cache);
  });

  it("gets what it puts until the lifetime passes", async () => {
    const { cache, clock } = setup();
    const key = CacheKey.of(Product, "prd_1");
    await expect(cache.get(key)).resolves.toBeUndefined();
    await cache.put(key, { id: "prd_1" }, TEN_MINUTES);
    await expect(cache.get(key)).resolves.toEqual({ id: "prd_1" });
    clock.time += Duration.toMilliseconds(TEN_MINUTES) - 1;
    await expect(cache.get(key)).resolves.toEqual({ id: "prd_1" });
    clock.time += 1;
    await expect(cache.get(key)).resolves.toBeUndefined();
  });

  it("stores nothing for a zero lifetime", async () => {
    const { cache } = setup();
    const key = CacheKey.of(Product, "prd_1");
    await cache.put(key, 1, TEN_MINUTES);
    await cache.put(key, 2, Duration.seconds(0));
    await expect(cache.get(key)).resolves.toBeUndefined();
  });

  it("remembers a load, and loads again once it expires", async () => {
    const { cache, clock } = setup();
    const key = CacheKey.of(Product, "prd_1", "en");
    const load = vi.fn(async () => "view");
    await expect(cache.remember(key, TEN_MINUTES, load)).resolves.toBe("view");
    await expect(cache.remember(key, TEN_MINUTES, load)).resolves.toBe("view");
    expect(load).toHaveBeenCalledTimes(1);
    clock.time += Duration.toMilliseconds(TEN_MINUTES);
    await cache.remember(key, TEN_MINUTES, load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("remembers a stored undefined as a hit", async () => {
    const { cache } = setup();
    const key = CacheKey.of(Product, "none");
    const load = vi.fn(() => undefined);
    await cache.remember(key, TEN_MINUTES, load);
    await cache.remember(key, TEN_MINUTES, load);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("shares one load between concurrent calls for a key", async () => {
    const { cache } = setup();
    const key = CacheKey.of(Product, "prd_1");
    const gate = deferred<string>();
    const load = vi.fn(() => gate.promise);
    const first = cache.remember(key, TEN_MINUTES, load);
    const second = cache.remember(key, TEN_MINUTES, load);
    gate.resolve("view");
    await expect(Promise.all([first, second])).resolves.toEqual(["view", "view"]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("stores nothing when the load rejects or throws, and loads again next time", async () => {
    const { cache } = setup();
    const key = CacheKey.of(Product, "prd_1");
    const failure = new Error("database down");
    const first = cache.remember(key, TEN_MINUTES, () => Promise.reject(failure));
    const shared = cache.remember(key, TEN_MINUTES, () => "unused");
    await expect(first).rejects.toBe(failure);
    await expect(shared).rejects.toBe(failure);
    await expect(
      cache.remember(key, TEN_MINUTES, () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
    await expect(cache.remember(key, TEN_MINUTES, () => "view")).resolves.toBe("view");
  });

  it("forgets a key and every key it covers, and nothing else", async () => {
    const { cache } = setup();
    await cache.put(CacheKey.of(Product, "prd_1", "en"), "en", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_1", "ar"), "ar", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_10", "en"), "other", TEN_MINUTES);
    await cache.forget(CacheKey.of(Product, "prd_1"));
    await expect(cache.get(CacheKey.of(Product, "prd_1", "en"))).resolves.toBeUndefined();
    await expect(cache.get(CacheKey.of(Product, "prd_1", "ar"))).resolves.toBeUndefined();
    await expect(cache.get(CacheKey.of(Product, "prd_10", "en"))).resolves.toBe("other");
  });

  it("answers a covered load in flight but does not store it", async () => {
    const { cache } = setup();
    const key = CacheKey.of(Product, "prd_1", "en");
    const gate = deferred<string>();
    const inFlight = cache.remember(key, TEN_MINUTES, () => gate.promise);
    await cache.forget(CacheKey.of(Product, "prd_1"));
    const fresh = vi.fn(async () => "after");
    const next = cache.remember(key, TEN_MINUTES, fresh);
    gate.resolve("before");
    await expect(inFlight).resolves.toBe("before");
    await expect(next).resolves.toBe("after");
    expect(fresh).toHaveBeenCalledTimes(1);
    await expect(cache.get(key)).resolves.toBe("after");
  });

  it("keeps a put over a load in flight for the same key", async () => {
    const { cache } = setup();
    const key = CacheKey.of(Product, "prd_1");
    const gate = deferred<string>();
    const inFlight = cache.remember(key, TEN_MINUTES, () => gate.promise);
    await cache.put(key, "put", TEN_MINUTES);
    gate.resolve("loaded");
    await expect(inFlight).resolves.toBe("loaded");
    await expect(cache.get(key)).resolves.toBe("put");
  });

  it("keeps namespaces apart for reads, writes and forgets", async () => {
    const { cache, namespace } = setup();
    const key = CacheKey.of(Product, "prd_1");
    namespace.name = "scope_a";
    await cache.put(key, "a", TEN_MINUTES);
    namespace.name = "scope_b";
    await expect(cache.get(key)).resolves.toBeUndefined();
    await cache.put(key, "b", TEN_MINUTES);
    await cache.forget(CacheKey.of(Product));
    namespace.name = "scope_a";
    await expect(cache.get(key)).resolves.toBe("a");
  });

  it("cannot be confused by a namespace containing the separators", async () => {
    const { cache, namespace } = setup();
    // Unencoded, this entry would read "a/Product:z/Product:prd_1", which forgetting "a/Product" would cover.
    namespace.name = "a/Product:z";
    await cache.put(CacheKey.of(Product, "prd_1"), "kept", TEN_MINUTES);
    namespace.name = "a";
    await cache.forget(CacheKey.of(Product));
    namespace.name = "a/Product:z";
    await expect(cache.get(CacheKey.of(Product, "prd_1"))).resolves.toBe("kept");
  });

  it("drops the least recently read entry past the bound", async () => {
    const { cache } = setup(2);
    const one = CacheKey.of(Product, "1");
    const two = CacheKey.of(Product, "2");
    const three = CacheKey.of(Product, "3");
    await cache.put(one, 1, TEN_MINUTES);
    await cache.put(two, 2, TEN_MINUTES);
    await cache.get(one);
    await cache.put(three, 3, TEN_MINUTES);
    await expect(cache.get(one)).resolves.toBe(1);
    await expect(cache.get(two)).resolves.toBeUndefined();
    await expect(cache.get(three)).resolves.toBe(3);
  });
});
