/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/money` (with the
 *          codec move of the 2026-10-24 decisions), and the rate, cash-rounding and unit-price values pricing and
 *          billing import, are exported, nothing else is, and `CurrencyCode` resolves.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0127 2026-10-24 note.
 */
import { Rounding } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import * as entry from "#core/index";
import type { CurrencyCode } from "#core/index";

describe("@stackra/money", () => {
  it("exports exactly the runtime surface", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "CashRounding",
      "ExchangeRate",
      "MemoryRateSourceDriver",
      "Money",
      "UnitPrice",
      "currencyCode",
      "decimalProduct",
      "money",
      "roundCash",
    ]);
  });

  it("supports the template's uses", () => {
    const currency: CurrencyCode = "USD";
    const perMonth = entry.Money.ofMinor(9900, currency).divide(12, Rounding.Down);
    expect(perMonth.toDecimal()).toBe("8.25");
    expect(entry.currencyCode().default("USD").parse(undefined)).toBe("USD");
    expect(entry.money().parse({ minor: 2000, currency }).minor).toBe(2000);
    const zero = entry.Money.zero(currency);
    const subtotal = [1250, 300].reduce(
      (sum, minor) => sum.plus(entry.Money.ofMinor(minor, currency).times(2)),
      zero,
    );
    expect(entry.Money.max(subtotal.plus(entry.Money.ofMinor(-9999, currency)), zero).minor).toBe(
      0,
    );
  });
});
