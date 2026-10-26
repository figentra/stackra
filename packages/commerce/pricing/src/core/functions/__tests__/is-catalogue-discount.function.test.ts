/**
 * Stackra file contract:
 * Purpose: unit tests of `isCatalogueDiscount`: every offer is a discount, a price list is one when any price falls or disappears, other kinds never are.
 * Boundary: test only; rows are test data standing in for `offer:<name>` and `rate-card:<name>` seed records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0391 (decision 4); owner OS-381.
 */
import { describe, expect, it } from "@stackra/testing";

import { isCatalogueDiscount } from "#core/functions/is-catalogue-discount.function";

const ROW = {
  id: "a",
  regionalTier: "low",
  currency: "USD",
  tier: "pro",
  period: "month",
  amount: "29.00",
};

describe("isCatalogueDiscount", () => {
  it("treats every offer as a discount", () => {
    expect(isCatalogueDiscount("offer", [], [])).toBe(true);
  });

  it("flags a price list that lowers or drops a price", () => {
    expect(isCatalogueDiscount("price-list", [ROW], [{ ...ROW, amount: "25.00" }])).toBe(true);
    expect(isCatalogueDiscount("price-list", [ROW], [])).toBe(true);
    expect(isCatalogueDiscount("price-list", [ROW], [{ ...ROW, amount: "35.00" }])).toBe(false);
    expect(isCatalogueDiscount("price-list", [], [ROW])).toBe(false);
  });

  it("never flags other kinds", () => {
    expect(isCatalogueDiscount("plan-catalogue", [], [])).toBe(false);
  });
});
