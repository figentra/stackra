/**
 * Stackra file contract:
 * Purpose: unit and type tests of `CountMode`: an `Enum.of` value with its snake_case codes in order and a same-named type.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0387.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CountMode } from "#core/enums/count-mode.enum";

describe("CountMode", () => {
  it("lists its codes", () => {
    expect(Enum.values(CountMode)).toEqual(["generated", "kept"]);
  });

  it("types one code", () => {
    expectTypeOf<CountMode>().toEqualTypeOf<"generated" | "kept">();
  });
});
