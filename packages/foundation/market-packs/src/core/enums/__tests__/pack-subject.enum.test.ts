/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PackSubject`: an `Enum.of` value with its snake_case codes in order and a same-named type.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0385.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PackSubject } from "#core/enums/pack-subject.enum";

describe("PackSubject", () => {
  it("lists its codes", () => {
    expect(Enum.values(PackSubject)).toEqual(["location", "buyer", "entity", "tenant"]);
  });

  it("types one code", () => {
    expectTypeOf<PackSubject>().toEqualTypeOf<"location" | "buyer" | "entity" | "tenant">();
  });
});
