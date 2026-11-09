/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PackEnvironment`: an `Enum.of` value with its snake_case codes in order and a
 *          same-named type.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0386.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PackEnvironment } from "#core/enums/pack-environment.enum";

describe("PackEnvironment", () => {
  it("lists its codes", () => {
    expect(Enum.values(PackEnvironment)).toEqual([
      "dev",
      "preview",
      "test",
      "staging",
      "production",
    ]);
  });

  it("types one code", () => {
    expectTypeOf<PackEnvironment>().toEqualTypeOf<
      "dev" | "preview" | "test" | "staging" | "production"
    >();
  });
});
