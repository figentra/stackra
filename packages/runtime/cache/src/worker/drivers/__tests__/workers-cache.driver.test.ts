/**
 * Stackra file contract:
 * Purpose: unit tests of `WorkersCacheDriver`: it is the `Cache` port, it finds its KV namespace by the configured
 *          binding name and refuses to start without one, it writes with an `expirationTtl` of at least KV's 60
 *          seconds while a shorter lifetime still ends on the clock, and `forget` follows every `list` page, dropping
 *          only the covered keys.
 * Boundary: test only; the binding lookup (`cloudflare:workers`) is mocked with an in-memory KV namespace.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0297 (decision 3);
 *                     ADR 0150 (decisions 1, 2 and 4).
 */
import { buildConfig } from "@stackra/config";
import { Clock, Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CacheConfig } from "#config/cache.config";
import { Cache } from "#contracts/ports/cache.port";
import { CacheKey } from "#core/constants/cache-key.constant";
import { SharedCacheNamespaceDriver } from "#core/drivers/shared-cache-namespace.driver";
import { WorkersCacheDriver } from "#worker/drivers/workers-cache.driver";

/** The Worker's bindings: one in-memory KV namespace that lists one key per page. */
const worker = vi.hoisted(() => {
  const values = new Map<string, string>();
  const kv = {
    get: vi.fn(async (key: string) => values.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      values.delete(key);
    }),
    list: vi.fn(async ({ prefix, cursor }: { prefix: string; cursor?: string }) => {
      const keys = [...values.keys()].filter((key) => key.startsWith(prefix)).sort();
      const index = cursor === undefined ? 0 : Number(cursor);
      const done = index + 1 >= keys.length;
      return {
        keys: keys.slice(index, index + 1).map((name) => ({ name })),
        list_complete: done,
        ...(done ? {} : { cursor: String(index + 1) }),
      };
    }),
  };
  return { values, kv, bindings: { PAGE_CACHE: kv } as Record<string, unknown> };
});

vi.mock("#worker/functions/worker-binding.function", () => ({
  workerBinding: (name: string) => worker.bindings[name],
}));

class ManualClock extends Clock {
  time = Date.parse("2026-10-24T09:00:00.000Z");

  now(): Date {
    return new Date(this.time);
  }
}

class Product {}

/** A driver over the `PAGE_CACHE` binding (or `binding`), with an empty namespace. */
function setup(binding = "PAGE_CACHE"): { cache: WorkersCacheDriver; clock: ManualClock } {
  worker.values.clear();
  vi.clearAllMocks();
  const clock = new ManualClock();
  const config = buildConfig(CacheConfig, {
    values: { driver: "workers", workers: { binding } },
  });
  return { cache: new WorkersCacheDriver(config, new SharedCacheNamespaceDriver(), clock), clock };
}

describe("WorkersCacheDriver", () => {
  it("is a driver of the Cache port", () => {
    expect(setup().cache).toBeInstanceOf(Cache);
  });

  it("refuses to start when the Worker has no KV namespace under the binding name", () => {
    expect(() => setup("MISSING")).toThrow(/MISSING/);
  });

  it("writes with KV's 60-second floor, yet a shorter lifetime ends on the clock", async () => {
    const { cache, clock } = setup();
    const key = CacheKey.of(Product, "prd_1");
    await cache.put(key, "short", Duration.seconds(5));
    expect(worker.kv.put).toHaveBeenLastCalledWith("/Product:prd_1", expect.any(String), {
      expirationTtl: 60,
    });
    await expect(cache.get(key)).resolves.toBe("short");
    clock.time += 5000;
    await expect(cache.get(key)).resolves.toBeUndefined();
    await cache.put(key, "long", Duration.seconds(90.5));
    expect(worker.kv.put).toHaveBeenLastCalledWith("/Product:prd_1", expect.any(String), {
      expirationTtl: 91,
    });
  });

  it("remembers a load", async () => {
    const { cache } = setup();
    const load = vi.fn(async () => ({ rows: [1, 2] }));
    await cache.remember(CacheKey.of(Product, "page_1"), Duration.minutes(5), load);
    await expect(
      cache.remember(CacheKey.of(Product, "page_1"), Duration.minutes(5), load),
    ).resolves.toEqual({ rows: [1, 2] });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("forgets every covered key across list pages, and nothing else", async () => {
    const { cache } = setup();
    const ttl = Duration.minutes(10);
    await cache.put(CacheKey.of(Product, "prd_1"), "base", ttl);
    await cache.put(CacheKey.of(Product, "prd_1", "en"), "en", ttl);
    await cache.put(CacheKey.of(Product, "prd_1", "ar"), "ar", ttl);
    await cache.put(CacheKey.of(Product, "prd_10"), "other", ttl);
    await cache.forget(CacheKey.of(Product, "prd_1"));
    expect(worker.kv.list).toHaveBeenCalledTimes(4);
    expect([...worker.values.keys()]).toEqual(["/Product:prd_10"]);
  });
});
