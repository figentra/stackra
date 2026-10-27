/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Jitter`: an `Enum.of` whose codes, order and case names are the contract.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); owner D10 2026-10-28.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Enum } from "#core/bases/enum.base";
import { Jitter } from "#core/enums/jitter.enum";

describe("Jitter", () => {
  it("holds exactly these codes, in this order", () => {
    expect(Enum.values(Jitter)).toEqual(["none", "equal", "added"]);
  });

  it("is a frozen Enum.of value whose case names are the PascalCase of the codes", () => {
    expect(Object.isFrozen(Jitter)).toBe(true);
    for (const [caseName, code] of Object.entries(Jitter) as [string, string][])
      expect(caseName.toLowerCase()).toBe(code.replaceAll("_", "").toLowerCase());
  });

  it("has a type of the same name that refuses other strings", () => {
    expectTypeOf<Jitter>().toEqualTypeOf<"none" | "equal" | "added">();
    const code: Jitter = Jitter.Equal;
    // @ts-expect-error -- not a code of Jitter
    const wrong: Jitter = "not_a_code";
    expect([code, wrong]).toEqual([Jitter.Equal, "not_a_code"]);
  });
});
