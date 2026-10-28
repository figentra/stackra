/**
 * Stackra file contract:
 * Purpose: unit tests of `storedCache`, the behaviour every driver shares: values round-trip through JSON entries,
 *          expiry on the clock (not the store's), a zero lifetime, untrusted stored text, single-flight `remember` (one
 *          read and one load for concurrent calls, nothing stored on a rejection or a synchronous throw), `forget` of a
 *          key and every key it covers (by prefix listing, and by index sets for a store without one), a covered load
 *          in flight not stored, a `put` winning over a load in flight, namespace isolation, a store failure rejecting
 *          the call, tags and `forgetTag`, stale-while-revalidate, one fill across instances through `CacheLock`,
 *          lifetime jitter, and metrics per key owner.
 * Boundary: test only; the store is an in-memory map (with or without prefix listing) that records each lifetime, with
 *           a settable clock and namespace; the lock and metrics are test-local drivers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0150 (decisions 1, 2
 *                     and 4); ADR 0305 (rule 32).
 */
import { Driver } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CacheLock } from "#contracts/ports/cache-lock.port";
import { CacheMetrics } from "#contracts/ports/cache-metrics.port";
import { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import type { CacheMetric } from "#contracts/types/cache-metric.type";
import { CacheKey } from "#core/constants/cache-key.constant";
import { storedCache } from "#core/functions/stored-cache.function";
import { textEntryStore } from "#core/functions/text-entry-store.function";
import type { CacheStore } from "#core/types/cache-store.type";
import type { StoredCacheSettings } from "#core/types/stored-cache-settings.type";

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

class Category {}

/** Records every observation. */
class RecordingCacheMetrics extends Driver(CacheMetrics) {
  readonly metrics: CacheMetric[] = [];

  record(metric: CacheMetric): void {
    this.metrics.push(metric);
  }
}

/** A lock shared by the "instances" of one test: one holder per key, never waiting. */
class SharedCacheLock extends Driver(CacheLock) {
  readonly held = new Set<string>();

  readonly keys: string[] = [];

  async tryWith(key: string, _ttl: Duration, work: () => Promise<void>): Promise<boolean> {
    this.keys.push(key);
    if (this.held.has(key)) return false;
    this.held.add(key);
    try {
      await work();
      return true;
    } finally {
      this.held.delete(key);
    }
  }
}

/** A store over a map, with every call spied; `listing: false` leaves out `keys`, as Valkey does. */
function mapStore(listing = true): CacheStore & {
  readonly texts: Map<string, string>;
  readonly sets: Map<string, Set<string>>;
} {
  const texts = new Map<string, string>();
  const sets = new Map<string, Set<string>>();
  const store: CacheStore & {
    readonly texts: Map<string, string>;
    readonly sets: Map<string, Set<string>>;
  } = {
    texts,
    sets,
    read: vi.fn(async (key: string) => texts.get(key)),
    write: vi.fn(async (key: string, text: string) => {
      texts.set(key, text);
    }),
    delete: vi.fn(async (key: string) => {
      texts.delete(key);
    }),
    add: vi.fn(async (set: string, member: string) => {
      sets.set(set, new Set([...(sets.get(set) ?? []), member]));
    }),
    members: vi.fn(async (set: string) => [...(sets.get(set) ?? [])]),
    clear: vi.fn(async (set: string) => {
      sets.delete(set);
    }),
  };
  if (listing)
    store.keys = vi.fn(async (prefix: string) =>
      [...texts.keys()].filter((key) => key.startsWith(prefix)),
    );
  return store;
}

/** The shared calls over a fresh store, with its clock and namespace. */
function setup(
  settings: Partial<StoredCacheSettings> = {},
  listing = true,
): {
  cache: ReturnType<typeof storedCache>;
  store: ReturnType<typeof mapStore>;
  clock: ManualClock;
  namespace: SettableCacheNamespace;
} {
  const store = mapStore(listing);
  const clock = new ManualClock();
  const namespace = new SettableCacheNamespace();
  return {
    cache: storedCache(textEntryStore(store), namespace, clock, settings),
    store,
    clock,
    namespace,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

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

describe("storedCache", () => {
  it("keeps each value as an entry under the namespaced key, with the lifetime for the store", async () => {
    const { cache, store, clock } = setup();
    await cache.put(CacheKey.of(Product, "prd_1"), { id: "prd_1" }, TEN_MINUTES);
    expect(store.write).toHaveBeenCalledWith(
      "/Product:prd_1",
      JSON.stringify({ value: { id: "prd_1" }, expiresAt: clock.time + 600_000 }),
      TEN_MINUTES,
    );
  });

  it("gets what it puts until the lifetime passes on the clock", async () => {
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

  it("stores nothing for a zero lifetime and drops what was there", async () => {
    const { cache, store } = setup();
    const key = CacheKey.of(Product, "prd_1");
    await cache.put(key, 1, TEN_MINUTES);
    await cache.put(key, 2, Duration.seconds(0));
    await expect(cache.get(key)).resolves.toBeUndefined();
    expect(store.texts.size).toBe(0);
  });

  it("reads stored text that is not an entry as absent", async () => {
    const { cache, store } = setup();
    store.texts.set("/Product:a", "not json");
    store.texts.set("/Product:b", JSON.stringify({ value: 1 }));
    store.texts.set("/Product:c", "null");
    store.texts.set("/Product:d", JSON.stringify({ value: 1, expiresAt: 1, staleUntil: "later" }));
    await expect(cache.get(CacheKey.of(Product, "a"))).resolves.toBeUndefined();
    await expect(cache.get(CacheKey.of(Product, "b"))).resolves.toBeUndefined();
    await expect(cache.get(CacheKey.of(Product, "c"))).resolves.toBeUndefined();
    await expect(cache.get(CacheKey.of(Product, "d"))).resolves.toBeUndefined();
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

  it("shares one read and one load between concurrent calls for a key", async () => {
    const { cache, store } = setup();
    const key = CacheKey.of(Product, "prd_1");
    const gate = deferred<string>();
    const load = vi.fn(() => gate.promise);
    const first = cache.remember(key, TEN_MINUTES, load);
    const second = cache.remember(key, TEN_MINUTES, load);
    gate.resolve("view");
    await expect(Promise.all([first, second])).resolves.toEqual(["view", "view"]);
    expect(load).toHaveBeenCalledTimes(1);
    expect(store.read).toHaveBeenCalledTimes(1);
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
    await cache.put(CacheKey.of(Product, "prd_1"), "base", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_1", "en"), "en", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_1", "ar"), "ar", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_10", "en"), "other", TEN_MINUTES);
    await cache.forget(CacheKey.of(Product, "prd_1"));
    await expect(cache.get(CacheKey.of(Product, "prd_1"))).resolves.toBeUndefined();
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
    namespace.name = "a/Product:z";
    await cache.put(CacheKey.of(Product, "prd_1"), "kept", TEN_MINUTES);
    namespace.name = "a";
    await cache.forget(CacheKey.of(Product));
    namespace.name = "a/Product:z";
    await expect(cache.get(CacheKey.of(Product, "prd_1"))).resolves.toBe("kept");
  });

  it("rejects the call when the store fails, and stores nothing", async () => {
    const { cache, store } = setup();
    const outage = new Error("store unreachable");
    vi.mocked(store.read).mockRejectedValueOnce(outage);
    const load = vi.fn(() => "view");
    await expect(cache.remember(CacheKey.of(Product, "prd_1"), TEN_MINUTES, load)).rejects.toBe(
      outage,
    );
    expect(load).not.toHaveBeenCalled();
    vi.mocked(store.write).mockRejectedValueOnce(outage);
    await expect(cache.put(CacheKey.of(Product, "prd_1"), 1, TEN_MINUTES)).rejects.toBe(outage);
    expect(store.texts.size).toBe(0);
  });
  it("forgets through index sets when the store cannot list a prefix, and never lists", async () => {
    const { cache, store } = setup({}, false);
    await cache.put(CacheKey.of(Product, "prd_1"), "base", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_1", "en"), "en", TEN_MINUTES);
    await cache.put(CacheKey.of(Product, "prd_10", "en"), "other", TEN_MINUTES);
    expect(store.add).toHaveBeenCalledWith("k//Product", "/Product:prd_1:en", TEN_MINUTES);
    expect(store.add).toHaveBeenCalledWith("k//Product:prd_1", "/Product:prd_1:en", TEN_MINUTES);
    await cache.forget(CacheKey.of(Product, "prd_1"));
    await expect(cache.get(CacheKey.of(Product, "prd_1"))).resolves.toBeUndefined();
    await expect(cache.get(CacheKey.of(Product, "prd_1", "en"))).resolves.toBeUndefined();
    await expect(cache.get(CacheKey.of(Product, "prd_10", "en"))).resolves.toBe("other");
    expect(store.clear).toHaveBeenCalledWith("k//Product:prd_1");
    expect(store.keys).toBeUndefined();
  });

  it("indexes nothing under covering keys when the store lists a prefix", async () => {
    const { cache, store } = setup();
    await cache.put(CacheKey.of(Product, "prd_1", "en"), "en", TEN_MINUTES);
    expect(store.add).not.toHaveBeenCalled();
  });

  it("forgets every entry carrying a tag, across owners, and nothing else", async () => {
    const { cache } = setup();
    const tag = CacheKey.of(Category, "cat_1");
    await cache.put(CacheKey.of(Product, "prd_1"), "one", TEN_MINUTES, { tags: [tag] });
    await cache.remember(CacheKey.of(Product, "list"), TEN_MINUTES, () => "list", { tags: [tag] });
    await cache.put(CacheKey.of(Product, "prd_2"), "two", TEN_MINUTES, {
      tags: [CacheKey.of(Category, "cat_10")],
    });
    await cache.forgetTag(tag);
    await expect(cache.get(CacheKey.of(Product, "prd_1"))).resolves.toBeUndefined();
    await expect(cache.get(CacheKey.of(Product, "list"))).resolves.toBeUndefined();
    await expect(cache.get(CacheKey.of(Product, "prd_2"))).resolves.toBe("two");
  });

  it("matches tags exactly: a tag does not cover the tags that extend it", async () => {
    const { cache } = setup();
    await cache.put(CacheKey.of(Product, "prd_1"), "one", TEN_MINUTES, {
      tags: [CacheKey.of(Category, "cat_1", "en")],
    });
    await cache.forgetTag(CacheKey.of(Category, "cat_1"));
    await expect(cache.get(CacheKey.of(Product, "prd_1"))).resolves.toBe("one");
  });

  it("keeps a tag inside its namespace", async () => {
    const { cache, namespace } = setup();
    const tag = CacheKey.of(Category, "cat_1");
    namespace.name = "scp_a";
    await cache.put(CacheKey.of(Product, "prd_1"), "a", TEN_MINUTES, { tags: [tag] });
    namespace.name = "scp_b";
    await cache.put(CacheKey.of(Product, "prd_1"), "b", TEN_MINUTES, { tags: [tag] });
    await cache.forgetTag(tag);
    await expect(cache.get(CacheKey.of(Product, "prd_1"))).resolves.toBeUndefined();
    namespace.name = "scp_a";
    await expect(cache.get(CacheKey.of(Product, "prd_1"))).resolves.toBe("a");
  });

  it("answers a tagged load in flight but does not store it once its tag is forgotten", async () => {
    const { cache } = setup();
    const key = CacheKey.of(Product, "prd_1");
    const tag = CacheKey.of(Category, "cat_1");
    const gate = deferred<string>();
    const inFlight = cache.remember(key, TEN_MINUTES, () => gate.promise, { tags: [tag] });
    await cache.forgetTag(tag);
    gate.resolve("before");
    await expect(inFlight).resolves.toBe("before");
    await expect(cache.get(key)).resolves.toBeUndefined();
  });

  it("serves a stale entry at once while one background load replaces it", async () => {
    const { cache, clock } = setup();
    const key = CacheKey.of(Product, "prd_1");
    const options = { stale: Duration.minutes(1) };
    await cache.remember(key, TEN_MINUTES, () => "old", options);
    clock.time += Duration.toMilliseconds(TEN_MINUTES);
    await expect(cache.get(key)).resolves.toBeUndefined();
    const gate = deferred<string>();
    const load = vi.fn(() => gate.promise);
    await expect(cache.remember(key, TEN_MINUTES, load, options)).resolves.toBe("old");
    await expect(cache.remember(key, TEN_MINUTES, load, options)).resolves.toBe("old");
    expect(load).toHaveBeenCalledOnce();
    gate.resolve("new");
    await vi.waitFor(async () => {
      await expect(cache.get(key)).resolves.toBe("new");
    });
  });

  it("keeps the stale entry when the background load fails, and loads past the window", async () => {
    const { cache, clock } = setup();
    const key = CacheKey.of(Product, "prd_1");
    const options = { stale: Duration.minutes(1) };
    await cache.remember(key, TEN_MINUTES, () => "old", options);
    clock.time += Duration.toMilliseconds(TEN_MINUTES);
    const failing = vi.fn(() => Promise.reject(new Error("database down")));
    await expect(cache.remember(key, TEN_MINUTES, failing, options)).resolves.toBe("old");
    await vi.waitFor(() => {
      expect(failing).toHaveBeenCalledOnce();
    });
    clock.time += Duration.toMilliseconds(Duration.minutes(1));
    await expect(cache.remember(key, TEN_MINUTES, () => "fresh", options)).resolves.toBe("fresh");
  });

  it("serves nothing stale to a caller that asks for no stale window", async () => {
    const { cache, clock } = setup();
    const key = CacheKey.of(Product, "prd_1");
    await cache.remember(key, TEN_MINUTES, () => "old", { stale: Duration.minutes(1) });
    clock.time += Duration.toMilliseconds(TEN_MINUTES);
    await expect(cache.remember(key, TEN_MINUTES, () => "new")).resolves.toBe("new");
  });

  it("stores the stale window beside the expiry and keeps the entry for both", async () => {
    const { cache, store, clock } = setup();
    await cache.put(CacheKey.of(Product, "prd_1"), 1, TEN_MINUTES);
    await cache.remember(CacheKey.of(Product, "prd_2"), TEN_MINUTES, () => 2, {
      stale: Duration.minutes(1),
    });
    expect(store.write).toHaveBeenLastCalledWith(
      "/Product:prd_2",
      JSON.stringify({
        value: 2,
        expiresAt: clock.time + 600_000,
        staleUntil: clock.time + 660_000,
      }),
      Duration.minutes(11),
    );
  });

  it("runs one locked fill across instances; the other reads the store until the value lands", async () => {
    const lock = new SharedCacheLock();
    const store = mapStore();
    const clock = new ManualClock();
    const namespace = new SettableCacheNamespace();
    const settings = { lock, fill: { wait: Duration.seconds(1), poll: Duration.parse("10ms") } };
    const one = storedCache(textEntryStore(store), namespace, clock, settings);
    const two = storedCache(textEntryStore(store), namespace, clock, settings);
    const key = CacheKey.of(Product, "prd_1");
    const gate = deferred<string>();
    const first = one.remember(key, TEN_MINUTES, () => gate.promise, { lock: true });
    await vi.waitFor(() => {
      expect(lock.held.size).toBe(1);
    });
    const second = vi.fn(() => "second");
    const waiting = two.remember(key, TEN_MINUTES, second, { lock: true });
    gate.resolve("first");
    await expect(Promise.all([first, waiting])).resolves.toEqual(["first", "first"]);
    expect(second).not.toHaveBeenCalled();
    expect(lock.keys[0]).toBe("cache.fill:/Product:prd_1");
  });

  it("loads itself when the other instance's fill does not land within the wait", async () => {
    const lock = new SharedCacheLock();
    lock.held.add("cache.fill:/Product:prd_1");
    const { cache } = setup({
      lock,
      fill: { wait: Duration.parse("30ms"), poll: Duration.parse("10ms") },
    });
    const load = vi.fn(() => "mine");
    await expect(
      cache.remember(CacheKey.of(Product, "prd_1"), TEN_MINUTES, load, { lock: true }),
    ).resolves.toBe("mine");
    expect(load).toHaveBeenCalledOnce();
  });

  it("takes no lock without lock: true", async () => {
    const lock = new SharedCacheLock();
    const { cache } = setup({ lock });
    await cache.remember(CacheKey.of(Product, "prd_1"), TEN_MINUTES, () => 1);
    expect(lock.keys).toEqual([]);
  });

  it("shortens a lifetime by up to the jitter, never below one millisecond", async () => {
    const { cache, store, clock } = setup({ jitter: 0.5, random: () => 0.5 });
    await cache.put(CacheKey.of(Product, "prd_1"), 1, TEN_MINUTES);
    expect(store.write).toHaveBeenLastCalledWith(
      "/Product:prd_1",
      JSON.stringify({ value: 1, expiresAt: clock.time + 450_000 }),
      Duration.seconds(450),
    );
    const full = setup({ jitter: 1, random: () => 1 - Number.EPSILON });
    await full.cache.put(CacheKey.of(Product, "prd_1"), 1, Duration.seconds(1));
    await expect(full.cache.get(CacheKey.of(Product, "prd_1"))).resolves.toBe(1);
  });

  it("records hits, stale hits, misses, loads and evictions by the key's owner", async () => {
    const metrics = new RecordingCacheMetrics();
    const { cache, clock } = setup({ metrics });
    const key = CacheKey.of(Product, "prd_1");
    await cache.get(key);
    await cache.remember(key, TEN_MINUTES, () => 1, { stale: Duration.minutes(1) });
    await cache.remember(key, TEN_MINUTES, () => 1);
    clock.time += Duration.toMilliseconds(TEN_MINUTES);
    await cache.remember(key, TEN_MINUTES, () => 2, { stale: Duration.minutes(1) });
    await vi.waitFor(() => {
      expect(metrics.metrics.filter((metric) => metric.event === "load")).toHaveLength(2);
    });
    await cache.forget(CacheKey.of(Product));
    expect(metrics.metrics.map((metric) => metric.event)).toEqual([
      "miss",
      "miss",
      "load",
      "hit",
      "stale",
      "load",
      "evict",
    ]);
    expect(new Set(metrics.metrics.map((metric) => metric.owner))).toEqual(new Set(["Product"]));
    expect(metrics.metrics.at(-1)).toEqual({ event: "evict", owner: "Product", value: 1 });
  });

  it("answers even when the metrics driver throws", async () => {
    class ThrowingCacheMetrics extends Driver(CacheMetrics) {
      record(): void {
        throw new Error("exporter down");
      }
    }
    const { cache } = setup({ metrics: new ThrowingCacheMetrics() });
    await expect(cache.remember(CacheKey.of(Product, "prd_1"), TEN_MINUTES, () => 1)).resolves.toBe(
      1,
    );
  });
});
