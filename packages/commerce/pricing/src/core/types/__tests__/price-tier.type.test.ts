/**
 * Stackra file contract:
 * Purpose: type tests of `PriceTier`: a bounded and an open band type-check, a missing price or a string bound does
 *          not, and both fields are read-only.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0242 (decision 2).
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import type { PriceTier } from "#core/types/price-tier.type";

describe("PriceTier", () => {
  it("takes a bounded band and an open band", () => {
    const included: PriceTier = { upTo: 1000, unitPrice: Money.zero("USD") };
    const rest: PriceTier = { upTo: null, unitPrice: Money.ofMinor(2, "USD") };
    expect([included.upTo, rest.upTo]).toEqual([1000, null]);
  });

  it("refuses a band without a price or with a string bound", () => {
    // @ts-expect-error -- every band has a unit price
    const unpriced: PriceTier = { upTo: 10 };
    // @ts-expect-error -- a bound is a number of units
    const text: PriceTier = { upTo: "10", unitPrice: Money.zero("USD") };
    expect([unpriced.upTo, text.upTo]).toEqual([10, "10"]);
  });

  it("is read-only", () => {
    const band: PriceTier = { upTo: 10, unitPrice: Money.zero("USD") };
    // @ts-expect-error -- bands are not edited in place
    band.upTo = 20;
    expect(band.upTo).toBe(20);
  });
});
