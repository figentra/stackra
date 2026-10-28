/**
 * Stackra file contract:
 * Purpose: unit tests of `PricePoint`: construction checks, every rounding mode onto a point, prices on or below the
 *          first point, zero kept free, other exponents (JPY, KWD), and the refusals (negative price, other currency).
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0244 (decision 6).
 */
import { Rounding } from "@stackra/contracts";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { PricePoint } from "#core/values/price-point.value";

const usd = (decimal: string) => Money.of(decimal, "USD");
const charm = PricePoint.ofMinor(100, 99, "USD");

describe("PricePoint.ofMinor", () => {
  it("holds the step, the ending and the currency", () => {
    const point = PricePoint.ofMinor(500, 495, "EUR");
    expect([point.step, point.ending, point.currency]).toEqual([500, 495, "EUR"]);
    expect(point).toBeInstanceOf(PricePoint);
  });

  it.each([0, -100, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])("refuses step %s", (step) => {
    expect(() => PricePoint.ofMinor(step, 0, "USD")).toThrow(RangeError);
  });

  it.each([-1, 100, 101, 0.5])("refuses ending %s with step 100", (ending) => {
    expect(() => PricePoint.ofMinor(100, ending, "USD")).toThrow(RangeError);
  });

  it("refuses a currency that is not an ISO 4217 code with minor units", () => {
    expect(() => PricePoint.ofMinor(100, 99, "usd")).toThrow(RangeError);
  });
});

describe("PricePoint#apply", () => {
  it("rounds up to the next point by default", () => {
    expect(charm.apply(usd("12.34")).toDecimal()).toBe("12.99");
    expect(charm.apply(usd("12.00")).toDecimal()).toBe("12.99");
    expect(charm.apply(usd("13.00")).toDecimal()).toBe("13.99");
  });

  it("keeps a price that is already on a point", () => {
    expect(charm.apply(usd("12.99")).toDecimal()).toBe("12.99");
    expect(charm.apply(usd("12.99"), Rounding.Down).toDecimal()).toBe("12.99");
  });

  it("takes the point below with Down and the nearest with the half modes", () => {
    expect(charm.apply(usd("12.34"), Rounding.Down).toDecimal()).toBe("11.99");
    expect(charm.apply(usd("12.34"), Rounding.HalfUp).toDecimal()).toBe("11.99");
    expect(charm.apply(usd("12.60"), Rounding.HalfEven).toDecimal()).toBe("12.99");
  });

  it("breaks a tie up with HalfUp and to an even k with HalfEven", () => {
    // 12.49 is halfway between 11.99 (k = 11) and 12.99 (k = 12).
    expect(charm.apply(usd("12.49"), Rounding.HalfUp).toDecimal()).toBe("12.99");
    expect(charm.apply(usd("12.49"), Rounding.HalfEven).toDecimal()).toBe("12.99");
    // 11.49 is halfway between 10.99 (k = 10) and 11.99 (k = 11).
    expect(charm.apply(usd("11.49"), Rounding.HalfEven).toDecimal()).toBe("10.99");
  });

  it("gives the first point to a price at or below it, in every mode", () => {
    for (const rounding of [Rounding.Up, Rounding.Down, Rounding.HalfUp, Rounding.HalfEven]) {
      expect(charm.apply(usd("0.10"), rounding).toDecimal()).toBe("0.99");
      expect(charm.apply(usd("0.99"), rounding).toDecimal()).toBe("0.99");
    }
  });

  it("keeps zero free", () => {
    const free = Money.zero("USD");
    expect(charm.apply(free)).toBe(free);
  });

  it("rounds to whole steps when the ending is zero", () => {
    const tens = PricePoint.ofMinor(1000, 0, "USD");
    expect(tens.apply(usd("41.00")).toDecimal()).toBe("50.00");
    expect(tens.apply(usd("41.00"), Rounding.Down).toDecimal()).toBe("40.00");
  });

  it("counts in the currency's own minor units", () => {
    const yen = PricePoint.ofMinor(100, 80, "JPY");
    expect(yen.apply(Money.ofMinor(1234, "JPY")).toDecimal()).toBe("1280");
    const dinar = PricePoint.ofMinor(1000, 950, "KWD");
    expect(dinar.apply(Money.of("3.100", "KWD")).toDecimal()).toBe("3.950");
  });

  it("returns a new value and leaves the price alone", () => {
    const price = usd("12.34");
    const rounded = charm.apply(price);
    expect(rounded).not.toBe(price);
    expect(price.minor).toBe(1234);
    expect(rounded.currency).toBe("USD");
  });

  it("refuses a negative price", () => {
    expect(() => charm.apply(usd("-1.00"))).toThrow(RangeError);
  });

  it("refuses a price in another currency", () => {
    expect(() => charm.apply(Money.of("12.34", "EUR"))).toThrow(RangeError);
  });

  it("refuses a point beyond the safe-integer limit", () => {
    const huge = PricePoint.ofMinor(Number.MAX_SAFE_INTEGER - 1, 0, "USD");
    expect(() => huge.apply(Money.ofMinor(Number.MAX_SAFE_INTEGER, "USD"))).toThrow(RangeError);
  });
});
