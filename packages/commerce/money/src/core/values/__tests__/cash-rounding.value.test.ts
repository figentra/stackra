/**
 * Stackra file contract:
 * Purpose: unit tests of `CashRounding`: a pack row's step and rounding move a total onto a cash step, refunds round
 *          like their mirror, the difference is the till's rounding line, and bad rows and other currencies are
 *          refused.
 * Boundary: test only; the rows are test data standing in for market-pack rows.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0220 (decision 3).
 */
import { Rounding } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CashRounding } from "#core/values/cash-rounding.value";
import { Money } from "#core/values/money.value";

const fiveRappen = CashRounding.of({
  currency: "CHF",
  incrementMinor: 5,
  rounding: Rounding.HalfUp,
});

describe("CashRounding", () => {
  it("holds the row", () => {
    expect([fiveRappen.currency, fiveRappen.incrementMinor, fiveRappen.rounding]).toEqual([
      "CHF",
      5,
      "half_up",
    ]);
  });

  it("moves a total onto the nearest step", () => {
    expect(fiveRappen.apply(Money.of("12.32", "CHF")).toDecimal()).toBe("12.30");
    expect(fiveRappen.apply(Money.of("12.33", "CHF")).toDecimal()).toBe("12.35");
    expect(fiveRappen.apply(Money.of("12.35", "CHF")).toDecimal()).toBe("12.35");
    expect(fiveRappen.apply(Money.of("-12.33", "CHF")).toDecimal()).toBe("-12.35");
  });

  it("follows the row's rounding", () => {
    const down = CashRounding.of({ currency: "AED", incrementMinor: 25, rounding: Rounding.Down });
    expect(down.apply(Money.of("10.99", "AED")).toDecimal()).toBe("10.75");
  });

  it("answers the rounding line", () => {
    expect(fiveRappen.difference(Money.of("12.33", "CHF")).toDecimal()).toBe("0.02");
    expect(fiveRappen.difference(Money.of("12.32", "CHF")).toDecimal()).toBe("-0.02");
  });

  it("refuses a bad row and another currency", () => {
    expect(() =>
      CashRounding.of({ currency: "CHF", incrementMinor: 0, rounding: Rounding.HalfUp }),
    ).toThrow(RangeError);
    expect(() =>
      CashRounding.of({ currency: "chf", incrementMinor: 5, rounding: Rounding.HalfUp }),
    ).toThrow(RangeError);
    expect(() =>
      CashRounding.of({ currency: "CHF", incrementMinor: 5, rounding: "nearest" as Rounding }),
    ).toThrow(RangeError);
    expect(() => fiveRappen.apply(Money.of("1.00", "EUR"))).toThrow(RangeError);
  });
});
