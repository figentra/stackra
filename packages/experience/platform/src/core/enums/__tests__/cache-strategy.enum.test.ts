/**
 * Stackra file contract:
 * Purpose: unit tests of `CacheStrategy`: its codes in source order, a case read by name, and the type of one code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CacheStrategy } from "#core/enums/cache-strategy.enum";

describe("CacheStrategy", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(CacheStrategy)).toEqual([
      "cache_first",
      "network_first",
      "stale_while_revalidate",
      "network_only",
      "cache_only",
    ]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(CacheStrategy.CacheFirst).toBe("cache_first");
    expectTypeOf(CacheStrategy.CacheFirst).toEqualTypeOf<"cache_first">();
    expectTypeOf<CacheStrategy>().toEqualTypeOf<
      "cache_first" | "network_first" | "stale_while_revalidate" | "network_only" | "cache_only"
    >();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(CacheStrategy)).toBe(true);
  });
});
