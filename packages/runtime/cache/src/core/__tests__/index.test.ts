/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: `CacheKey` (the template's `{ type Cache, CacheKey }` import keeps
 *          `CacheKey` here; `Cache` moves to `./contracts`, A3) and the registry row's configuration and drivers are
 *          exported, nothing else is (`Cache`, `CacheNamespace`, `coversKey` and `storedCache` are not), and
 *          `CacheKey` is both a value and a type.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CACHE_CONFIG_SCHEMA } from "#core/constants/cache-config-schema.constant";
import * as cache from "#core/index";
import type { CacheKey } from "#core/index";

describe("@stackra/cache", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(cache).sort()).toEqual([
      "CacheConfig",
      "CacheConfig$",
      "CacheHealthIndicatorDriver",
      "CacheKey",
      "CacheOptions",
      "MemoryCacheDriver",
      "SharedCacheNamespaceDriver",
      "StorageCacheDriver",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(cache.CacheConfig$).toBe(CACHE_CONFIG_SCHEMA);
  });

  it("exports CacheKey as a value and a type", () => {
    class Product {}
    expectTypeOf(cache.CacheKey.of(Product, "prd_1")).toEqualTypeOf<CacheKey>();
  });
});
