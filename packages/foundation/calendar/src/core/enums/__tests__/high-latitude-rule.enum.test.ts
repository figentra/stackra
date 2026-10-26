/**
 * Stackra file contract:
 * Purpose: unit and type tests of `HighLatitudeRule`: an `Enum.of` value with its snake_case codes in order and a
 *          same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0414.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { HighLatitudeRule } from "#core/enums/high-latitude-rule.enum";

describe("HighLatitudeRule", () => {
  it("lists its codes", () => {
    expect(Enum.values(HighLatitudeRule)).toEqual([
      "none",
      "angle_based",
      "middle_of_night",
      "one_seventh",
    ]);
  });

  it("types one code", () => {
    expectTypeOf<HighLatitudeRule>().toEqualTypeOf<
      "none" | "angle_based" | "middle_of_night" | "one_seventh"
    >();
  });
});
