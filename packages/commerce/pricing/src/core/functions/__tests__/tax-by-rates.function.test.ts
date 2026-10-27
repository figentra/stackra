/**
 * Stackra file contract:
 * Purpose: unit tests of `taxByRates`: tax taken out of an inclusive price and added on an exclusive one, the
 *          subdivision's row before the country's, a zero-rated class, the table's rounding and source, and the
 *          refusals (no row, another currency, a malformed rate).
 * Boundary: test only; the rows are test data standing in for market-pack tax tables.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; the OS-109 answer; ADR 0244 (decision 9).
 */
import { Rounding } from "@stackra/contracts";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";
import type { CountryCode } from "@stackra/validation";

import type { TaxRequest } from "#contracts/types/tax-request.type";
import { taxByRates } from "#core/functions/tax-by-rates.function";
import type { TaxRateTable } from "#core/types/tax-rate-table.type";

const table: TaxRateTable = {
  source: "test@1.0.0",
  rounding: Rounding.HalfUp,
  rates: [
    { jurisdiction: "sa", taxClass: "standard", rate: "0.15" },
    { jurisdiction: "sa", taxClass: "zero", rate: "0" },
    { jurisdiction: "ae", taxClass: "standard", rate: "0.05" },
    { jurisdiction: "us-ny", taxClass: "standard", rate: "0.08875" },
  ],
};

/** A one-line request in `currency` to `country`/`region`. */
const request = (
  amount: Money,
  country: CountryCode,
  region: string | null,
  pricesIncludeTax: boolean,
  taxClass = "standard",
): TaxRequest => ({
  currency: amount.currency,
  at: new Date("2026-10-25"),
  destination: region === null ? { country } : { country, region },
  pricesIncludeTax,
  lines: [{ id: "l1", amount, taxClass }],
});

describe("taxByRates", () => {
  it("takes the tax out of an inclusive price", () => {
    const quote = taxByRates(request(Money.of("115.00", "SAR"), "SA", null, true), table);
    expect(quote.total.toDecimal()).toBe("15.00");
    expect(quote.lines).toEqual([
      { id: "l1", tax: Money.of("15.00", "SAR"), rate: "0.15", jurisdiction: "sa" },
    ]);
    expect(quote.source).toBe("test@1.0.0");
  });

  it("adds the tax on an exclusive price, rounded by the table", () => {
    const quote = taxByRates(request(Money.of("10.00", "USD"), "US", "NY", false), table);
    expect(quote.total.toDecimal()).toBe("0.89");
    expect(quote.lines[0]?.jurisdiction).toBe("us-ny");
  });

  it("falls back from the subdivision to the country", () => {
    const quote = taxByRates(request(Money.of("100.00", "AED"), "AE", "DU", false), table);
    expect(quote.lines[0]?.jurisdiction).toBe("ae");
    expect(quote.total.toDecimal()).toBe("5.00");
  });

  it("taxes a zero-rated class at zero", () => {
    expect(
      taxByRates(request(Money.of("50.00", "SAR"), "SA", null, false, "zero"), table).total.minor,
    ).toBe(0);
  });

  it("refuses a class with no row, another currency and a malformed rate", () => {
    expect(() => taxByRates(request(Money.of("1.00", "USD"), "US", "CA", false), table)).toThrow(
      RangeError,
    );
    const mixed: TaxRequest = {
      ...request(Money.of("1.00", "SAR"), "SA", null, false),
      currency: "USD",
    };
    expect(() => taxByRates(mixed, table)).toThrow(RangeError);
    const bad: TaxRateTable = {
      ...table,
      rates: [{ jurisdiction: "sa", taxClass: "standard", rate: "15%" }],
    };
    expect(() => taxByRates(request(Money.of("1.00", "SAR"), "SA", null, false), bad)).toThrow(
      RangeError,
    );
  });
});
