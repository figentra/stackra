/**
 * Stackra file contract:
 * Purpose: unit and type tests of `FloorBound`: an `Enum.of` value with its codes in order and a same-named type.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { FloorBound } from "#core/enums/floor-bound.enum";

describe("FloorBound", () => {
  it("lists its codes", () => {
    expect(Enum.values(FloorBound)).toEqual(["min", "max", "list"]);
  });

  it("types one code", () => {
    expectTypeOf<FloorBound>().toEqualTypeOf<"min" | "max" | "list">();
  });
});
