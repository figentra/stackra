/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Cache` port: an abstract class that extends `Port`, carries the port brand, is
 *          implemented by `Driver(Cache)`, takes only a `CacheKey` and a `Duration`, and is a container token a test
 *          can override.
 * Boundary: test only; the driver here is a test-local map driver with no expiry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0305 (rule 32); ADR 0294
 *                     (decisions 16 and 17).
 */
import { Container, Driver } from "@stackra/container";
import { Duration, Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Cache } from "#contracts/ports/cache.port";
import type { CacheKey } from "#contracts/types/cache-key.type";

class MapCacheDriver extends Driver(Cache) {
  readonly values = new Map<string, unknown>();

  get<T>(key: CacheKey): Promise<T | undefined> {
    return Promise.resolve(this.values.get(key) as T | undefined);
  }

  put<T>(key: CacheKey, value: T): Promise<void> {
    this.values.set(key, value);
    return Promise.resolve();
  }

  async remember<T>(key: CacheKey, _ttl: Duration, load: () => T | Promise<T>): Promise<T> {
    if (this.values.has(key)) return this.values.get(key) as T;
    const value = await load();
    this.values.set(key, value);
    return value;
  }

  forget(key: CacheKey): Promise<void> {
    this.values.delete(key);
    return Promise.resolve();
  }
}

const KEY = "Product:prd_1" as CacheKey;

describe("Cache", () => {
  it("is an abstract port", () => {
    expect(new MapCacheDriver()).toBeInstanceOf(Port);
    expect(new MapCacheDriver()).toBeInstanceOf(Cache);
    expectTypeOf<Cache["~kind"]>().toEqualTypeOf<"port">();
    // @ts-expect-error -- a port is abstract
    const direct = new Cache();
    expect(direct).toBeInstanceOf(Port);
  });

  it("makes a driver implement every member", () => {
    // @ts-expect-error -- get, put, remember and forget are abstract and not implemented
    class EmptyDriver extends Driver(Cache) {}
    expect(EmptyDriver).toBeTypeOf("function");
  });

  it("takes a CacheKey and a Duration, never plain values", () => {
    expectTypeOf<Parameters<Cache["forget"]>[0]>().toEqualTypeOf<CacheKey>();
    expectTypeOf<Parameters<Cache["remember"]>[1]>().toEqualTypeOf<Duration>();
    expectTypeOf<[string]>().not.toExtend<Parameters<Cache["forget"]>>();
  });

  it("types remember by its load", async () => {
    const cache: Cache = new MapCacheDriver();
    const view = cache.remember(KEY, Duration.minutes(10), async () => ({ id: "prd_1" }));
    expectTypeOf(view).toEqualTypeOf<Promise<{ id: string }>>();
    await expect(view).resolves.toEqual({ id: "prd_1" });
  });

  it("is a container token", async () => {
    const driver = new MapCacheDriver();
    const container = await Container.create([], { overrides: new Map([[Cache, driver]]) });
    await container.get(Cache).put(KEY, 1, Duration.minutes(1));
    expect(driver.values.get(KEY)).toBe(1);
  });
});
