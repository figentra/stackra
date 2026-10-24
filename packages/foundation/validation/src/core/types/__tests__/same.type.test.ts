/**
 * Stackra file contract:
 * Purpose: type tests of `Same<A, B>`: mutually assignable types are the same, a wider or narrower type is not, and a
 *          union does not distribute.
 * Boundary: test only; type assertions through `expectTypeOf`, with one runtime assertion so the file runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { Same } from "#core/types/same.type";

describe("Same", () => {
  it("is true for mutually assignable types", () => {
    expectTypeOf<
      Same<{ a?: string; b: number }, { a?: string; b: number }>
    >().toEqualTypeOf<true>();
    expectTypeOf<Same<PublicId<"ord">, `ord_${string}`>>().toEqualTypeOf<true>();
  });

  it("is false for a wider, a narrower or a different type", () => {
    expectTypeOf<Same<string, "a">>().toEqualTypeOf<false>();
    expectTypeOf<Same<{ a: string }, { a: string; b: number }>>().toEqualTypeOf<false>();
    expectTypeOf<Same<{ a?: string }, { a: string }>>().toEqualTypeOf<false>();
    expectTypeOf<Same<boolean, true>>().toEqualTypeOf<false>();
    expect(true).toBe(true);
  });
});
