/**
 * Stackra file contract:
 * Purpose: unit tests of `totalOf`: the amount alone, or the amount plus the tip; a tip in another currency throws.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0220.
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { totalOf } from "#core/functions/total-of.function";

describe("totalOf", () => {
  it("adds the tip to the amount", () => {
    const amount = Money.ofMinor(10_000, "SAR");
    expect(totalOf({ amount }).minor).toBe(10_000);
    expect(totalOf({ amount, tip: Money.ofMinor(1_500, "SAR") }).minor).toBe(11_500);
  });

  it("refuses a tip in another currency", () => {
    expect(() =>
      totalOf({ amount: Money.ofMinor(100, "SAR"), tip: Money.ofMinor(1, "AED") }),
    ).toThrow(RangeError);
  });
});
