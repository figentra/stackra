/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryTaxProviderDriver`: it records each request and taxes it from the table a test sets,
 *          and refuses every class while the table is empty.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266.
 */
import { Rounding } from "@stackra/contracts";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import type { TaxRequest } from "#contracts/types/tax-request.type";
import { MemoryTaxProviderDriver } from "#core/drivers/memory-tax-provider.driver";

const sale: TaxRequest = {
  currency: "SAR",
  at: new Date("2026-10-25"),
  destination: { country: "SA" },
  pricesIncludeTax: false,
  lines: [{ id: "l1", amount: Money.of("100.00", "SAR"), taxClass: "standard" }],
};

describe("MemoryTaxProviderDriver", () => {
  it("refuses while the table is empty", async () => {
    await expect(new MemoryTaxProviderDriver().quote(sale)).rejects.toThrow(RangeError);
  });

  it("taxes from the table and records the request", async () => {
    const tax = new MemoryTaxProviderDriver();
    tax.table = {
      source: "test",
      rounding: Rounding.HalfUp,
      rates: [{ jurisdiction: "sa", taxClass: "standard", rate: "0.15" }],
    };
    expect((await tax.quote(sale)).total.toDecimal()).toBe("15.00");
    expect(tax.requests).toEqual([sale]);
  });
});
