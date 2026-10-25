/**
 * Stackra file contract:
 * Purpose: type tests of `TaxGroup`: a group with money sums and a nullable exemption.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import type { TaxGroup } from "#core/types/tax-group.type";

describe("TaxGroup", () => {
  it("takes a standard group and refuses a numeric net", () => {
    const group: TaxGroup = {
      category: "S",
      rate: "20",
      exemption: null,
      net: Money.ofMinor(100, "EUR"),
      tax: Money.ofMinor(20, "EUR"),
    };
    // @ts-expect-error -- sums are Money
    const numeric: TaxGroup = { ...group, net: 100 };
    expect([group.tax.toDecimal(), numeric.rate]).toEqual(["0.20", "20"]);
  });
});
