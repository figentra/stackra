/**
 * Stackra file contract:
 * Purpose: unit tests of `CachePreset`: its codes in source order, a case read by name, and the type of one code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CachePreset } from "#core/enums/cache-preset.enum";

describe("CachePreset", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(CachePreset)).toEqual(["online_first", "offline_first", "balanced"]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(CachePreset.OnlineFirst).toBe("online_first");
    expectTypeOf(CachePreset.OnlineFirst).toEqualTypeOf<"online_first">();
    expectTypeOf<CachePreset>().toEqualTypeOf<"online_first" | "offline_first" | "balanced">();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(CachePreset)).toBe(true);
  });
});
