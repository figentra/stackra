/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PackStatus`: an `Enum.of` value with its snake_case codes in order and a same-named type.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PackStatus } from "#core/enums/pack-status.enum";

describe("PackStatus", () => {
  it("lists its codes", () => {
    expect(Enum.values(PackStatus)).toEqual(["draft", "beta", "live", "retired"]);
  });

  it("types one code", () => {
    expectTypeOf<PackStatus>().toEqualTypeOf<"draft" | "beta" | "live" | "retired">();
  });
});
