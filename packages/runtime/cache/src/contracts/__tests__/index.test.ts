/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: `Cache` (the template's web wiring imports it from
 *          `@stackra/cache/contracts`), `CacheNamespace`, `CacheLock`, `CacheMetrics` and `CacheSql` are the values exported,
 *          beside the option and metric types; the `CacheKey` brand stays with `.`.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { CacheMetric, CachePutOptions, CacheRememberOptions } from "#contracts/index";
import { Cache } from "#contracts/ports/cache.port";
import { CacheLock } from "#contracts/ports/cache-lock.port";
import { CacheMetrics } from "#contracts/ports/cache-metrics.port";
import { CacheNamespace } from "#contracts/ports/cache-namespace.port";
import { CacheSql } from "#contracts/ports/cache-sql.port";

describe("@stackra/cache/contracts", () => {
  it("exports exactly its ports", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "Cache",
      "CacheLock",
      "CacheMetrics",
      "CacheNamespace",
      "CacheSql",
    ]);
    expect(contracts.Cache).toBe(Cache);
    expect(contracts.CacheLock).toBe(CacheLock);
    expect(contracts.CacheMetrics).toBe(CacheMetrics);
    expect(contracts.CacheNamespace).toBe(CacheNamespace);
    expect(contracts.CacheSql).toBe(CacheSql);
  });

  it("exports the option and metric types", () => {
    expectTypeOf<CacheRememberOptions>().toExtend<CachePutOptions>();
    expectTypeOf<CacheMetric["event"]>().toEqualTypeOf<
      "hit" | "stale" | "miss" | "load" | "evict"
    >();
  });
});
