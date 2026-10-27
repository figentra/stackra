/**
 * Stackra file contract:
 * Purpose: unit and type tests of `RetryOn`: an `Enum.of` whose codes, order and case names are the contract.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); owner D10 2026-10-28.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Enum } from "#core/bases/enum.base";
import { RetryOn } from "#core/enums/retry-on.enum";

describe("RetryOn", () => {
  it("holds exactly these codes, in this order", () => {
    expect(Enum.values(RetryOn)).toEqual(["network", "retryable"]);
  });

  it("is a frozen Enum.of value whose case names are the PascalCase of the codes", () => {
    expect(Object.isFrozen(RetryOn)).toBe(true);
    for (const [caseName, code] of Object.entries(RetryOn) as [string, string][])
      expect(caseName.toLowerCase()).toBe(code.replaceAll("_", "").toLowerCase());
  });

  it("has a type of the same name that refuses other strings", () => {
    expectTypeOf<RetryOn>().toEqualTypeOf<"network" | "retryable">();
    const code: RetryOn = RetryOn.Network;
    // @ts-expect-error -- not a code of RetryOn
    const wrong: RetryOn = "not_a_code";
    expect([code, wrong]).toEqual([RetryOn.Network, "not_a_code"]);
  });
});
