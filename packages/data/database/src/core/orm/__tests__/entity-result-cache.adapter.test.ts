/**
 * Stackra file contract:
 * Purpose: unit tests of `EntityResultCacheAdapter`: it reads, stores (for the ORM's expiration) and forgets through
 *          the connected `Cache` in the shared context, does nothing without one, and turns a cache failure into a miss.
 * Boundary: test only; a recording stand-in cache, context storage and resolver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0150 (decision 5); ADR 0022; data-layer gap ca5.
 */
import { SHARED_CACHE_CONTEXT } from "@stackra/actions";
import { ContextStorage } from "@stackra/actions/contracts";
import { Cache } from "@stackra/cache/contracts";
import { Duration } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { connectVisibilityFilter } from "#core/functions/connect-visibility-filter.function";
import { EntityResultCacheAdapter } from "#core/orm/entity-result-cache.adapter";

/** A failed cache call. */
function fail(): Promise<never> {
  return Promise.reject(new Error("cache down"));
}

/** Connects a resolver with a cache over `entries` that records its calls and the context each ran in. */
function connect(entries: Map<string, unknown>, failing = false): unknown[][] {
  const calls: unknown[][] = [];
  let current: object | undefined;
  const cache = {
    get: (key: string) => {
      calls.push(["get", key, current]);
      return failing ? fail() : Promise.resolve(entries.get(key));
    },
    put: (key: string, value: unknown, ttl: Duration) => {
      calls.push(["put", key, value, ttl, current]);
      if (failing) return fail();
      entries.set(key, value);
      return Promise.resolve();
    },
    forget: (key: string) => {
      calls.push(["forget", key, current]);
      entries.delete(key);
      return Promise.resolve();
    },
  };
  const storage = {
    run: <T>(value: object, work: () => T): T => {
      current = value;
      return work();
    },
    current: () => current,
  };
  connectVisibilityFilter({
    has: (token) => token === Cache || token === ContextStorage,
    get: ((token: unknown) => (token === Cache ? cache : storage)) as never,
  });
  return calls;
}

afterEach(() => connectVisibilityFilter(undefined));

describe("EntityResultCacheAdapter", () => {
  it("stores, reads and forgets through the cache in the shared context", async () => {
    const calls = connect(new Map());
    const adapter = new EntityResultCacheAdapter();
    await adapter.set("Product:prd_1:-:-", { id: "prd_1" }, "", 600_000);
    expect(await adapter.get("Product:prd_1:-:-")).toEqual({ id: "prd_1" });
    await adapter.remove("Product:prd_1");
    expect(calls).toEqual([
      ["put", "Product:prd_1:-:-", { id: "prd_1" }, Duration.minutes(10), SHARED_CACHE_CONTEXT],
      ["get", "Product:prd_1:-:-", SHARED_CACHE_CONTEXT],
      ["forget", "Product:prd_1", SHARED_CACHE_CONTEXT],
    ]);
  });

  it("stores nothing without a positive expiration", async () => {
    const calls = connect(new Map());
    await new EntityResultCacheAdapter().set("Product:prd_1", {}, "");
    expect(calls).toEqual([]);
  });

  it("answers a miss with no cache bound or when the cache fails", async () => {
    const adapter = new EntityResultCacheAdapter();
    expect(await adapter.get("Product:prd_1")).toBeUndefined();
    connect(new Map(), true);
    expect(await adapter.get("Product:prd_1")).toBeUndefined();
    await expect(adapter.set("Product:prd_1", {}, "", 1000)).resolves.toBeUndefined();
  });
});
