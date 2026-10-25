/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/money` (with the
 *          codec move of the 2026-10-24 decisions) is exported, nothing else is, and `CurrencyCode` resolves.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0127 2026-10-24 note.
 */
import { describe, expect, it } from "@stackra/testing";

import * as entry from "#core/index";
import type { CurrencyCode } from "#core/index";

describe("@stackra/money", () => {
  it("exports exactly the runtime surface", () => {
    expect(Object.keys(entry).sort()).toEqual(["Money", "Rounding", "currencyCode", "money"]);
  });

  it("supports the template's uses", () => {
    const currency: CurrencyCode = "USD";
    const perMonth = entry.Money.ofMinor(9_900, currency).divide(12, entry.Rounding.Down);
    expect(perMonth.toDecimal()).toBe("8.25");
    expect(entry.currencyCode().default("USD").parse(undefined)).toBe("USD");
    expect(entry.money().parse({ minor: 2_000, currency }).minor).toBe(2_000);
    const zero = entry.Money.zero(currency);
    const subtotal = [1_250, 300].reduce(
      (sum, minor) => sum.plus(entry.Money.ofMinor(minor, currency).times(2)),
      zero,
    );
    expect(entry.Money.max(subtotal.plus(entry.Money.ofMinor(-9_999, currency)), zero).minor).toBe(
      0,
    );
  });
});
