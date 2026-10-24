/**
 * Stackra file contract:
 * Purpose: type tests of the `CacheKey` brand: a key reads as a string, but a plain string is not a key.
 * Boundary: test only; type assertions with one runtime anchor.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0305 (rule 32).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { CacheKey } from "#contracts/types/cache-key.type";

describe("CacheKey (type)", () => {
  it("is a string, but a string is not a key", () => {
    expectTypeOf<CacheKey>().toExtend<string>();
    expectTypeOf<string>().not.toExtend<CacheKey>();
    // @ts-expect-error -- only CacheKey.of makes a key
    const key: CacheKey = "Product:prd_1";
    expect(key).toBe("Product:prd_1");
  });
});
