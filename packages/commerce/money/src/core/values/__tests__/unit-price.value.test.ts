/**
 * Stackra file contract:
 * Purpose: unit tests of `UnitPrice`: six fraction digits held as millionths, a quantity charged with one rounding into
 *          whole minor units of any exponent, the decimal form, and the refusals.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0220; the OS-114 answer.
 */
import { Rounding } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { UnitPrice } from "#core/values/unit-price.value";

describe("UnitPrice", () => {
  it("keeps six decimals as millionths", () => {
    const call = UnitPrice.of("0.000123", "USD");
    expect([call.micros, call.currency]).toEqual([123, "USD"]);
    expect(call.toDecimal()).toBe("0.000123");
    expect(UnitPrice.of("2.5", "EUR").toDecimal()).toBe("2.500000");
    expect(UnitPrice.of("-1.5", "EUR").toDecimal()).toBe("-1.500000");
    // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (Dates become strings, undefined and functions drop)
    expect(JSON.parse(JSON.stringify(call))).toEqual({ micros: 123, currency: "USD" });
  });

  it("charges a quantity with one rounding", () => {
    const call = UnitPrice.of("0.000123", "USD");
    expect(call.times(1_000_000).toDecimal()).toBe("123.00");
    expect(call.times(10).toDecimal()).toBe("0.00");
    expect(call.times(50_000, Rounding.Up).toDecimal()).toBe("6.15");
    expect(UnitPrice.of("0.004", "USD").times("2.5", Rounding.Up).toDecimal()).toBe("0.01");
  });

  it("counts in the currency's exponent", () => {
    expect(UnitPrice.of("0.0005", "KWD").times(3).toDecimal()).toBe("0.002");
    expect(UnitPrice.of("0.4", "JPY").times(3).toDecimal()).toBe("1");
  });

  it("compares by amount and currency", () => {
    expect(UnitPrice.of("0.1", "USD").equals(UnitPrice.ofMicros(100_000, "USD"))).toBe(true);
    expect(UnitPrice.of("0.1", "USD").equals(UnitPrice.of("0.1", "EUR"))).toBe(false);
  });

  it("refuses a seventh decimal, an unsafe amount and a bad currency", () => {
    expect(() => UnitPrice.of("0.0000001", "USD")).toThrow(RangeError);
    expect(() => UnitPrice.of("abc", "USD")).toThrow(RangeError);
    expect(() => UnitPrice.of("1", "usd")).toThrow(RangeError);
    expect(() => UnitPrice.ofMicros(1.5, "USD")).toThrow(RangeError);
  });
});
