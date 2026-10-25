/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Rounding`: an `Enum.of` whose codes, order and case names are the contract.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0220 (decision 3);
 *                     ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Rounding } from "#core/enums/rounding.enum";

describe("Rounding", () => {
  it("holds exactly these codes, in this order", () => {
    expect(Enum.values(Rounding)).toEqual(["down", "up", "half_up", "half_even"]);
  });

  it("is a frozen Enum.of value whose case names are the PascalCase of the codes", () => {
    expect(Object.isFrozen(Rounding)).toBe(true);
    for (const [caseName, code] of Object.entries(Rounding) as [string, string][])
      expect(caseName.toLowerCase()).toBe(code.replaceAll("_", "").toLowerCase());
  });

  it("has a type of the same name that refuses other strings", () => {
    const mode: Rounding = Rounding.HalfEven;
    // @ts-expect-error -- not a code of Rounding
    const wrong: Rounding = "half_down";
    expect([mode, wrong]).toEqual(["half_even", "half_down"]);
  });
});
