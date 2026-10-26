/**
 * Stackra file contract:
 * Purpose: unit tests of `roundCash`: a currency with no row is unchanged, a required row always applies, and an
 *          optional row (the US 5-cent rule) applies only when the tenant opted in.
 * Boundary: test only; the rows are test data standing in for market-pack rows.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0220 (decision 3); owner US-39.
 */
import { describe, expect, it } from "@stackra/testing";

import { Rounding } from "#core/enums/rounding.enum";
import { roundCash } from "#core/functions/round-cash.function";
import { Money } from "#core/values/money.value";

const TABLE = [
  { currency: "USD", incrementMinor: 5, rounding: Rounding.HalfUp, optional: true },
  { currency: "CHF", incrementMinor: 5, rounding: Rounding.HalfUp },
];

describe("roundCash", () => {
  it("applies an optional row only when opted in", () => {
    expect(roundCash(Money.of("12.33", "USD"), TABLE, true).toDecimal()).toBe("12.35");
    expect(roundCash(Money.of("12.33", "USD"), TABLE, false).toDecimal()).toBe("12.33");
  });

  it("always applies a required row and leaves other currencies alone", () => {
    expect(roundCash(Money.of("12.32", "CHF"), TABLE, false).toDecimal()).toBe("12.30");
    expect(roundCash(Money.of("12.33", "EUR"), TABLE, true).toDecimal()).toBe("12.33");
  });

  it("refuses a malformed row", () => {
    expect(() =>
      roundCash(
        Money.of("1.00", "USD"),
        [{ currency: "USD", incrementMinor: 0, rounding: Rounding.HalfUp }],
        true,
      ),
    ).toThrow(RangeError);
  });
});
