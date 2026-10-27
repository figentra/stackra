/**
 * Stackra file contract:
 * Purpose: unit tests of `ExchangeRate`: a snapshot is checked, a currency pair converts across exponents with one
 *          rounding, a commodity rate prices grams of metal exactly, each refuses the other's call, and the snapshot
 *          comes back unchanged.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0220 (decision 3); ADR 0244 (decision 9).
 */
import { Rounding } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { RateSnapshot } from "#contracts/types/rate-snapshot.type";
import { ExchangeRate } from "#core/values/exchange-rate.value";
import { Money } from "#core/values/money.value";

const at = new Date("2026-10-25T08:00:00Z");
const usdSar: RateSnapshot = {
  base: "USD",
  quote: "SAR",
  unit: null,
  rate: "3.75",
  source: "sama",
  at,
};
const goldSar: RateSnapshot = {
  base: "XAU",
  quote: "SAR",
  unit: "gram",
  rate: "251.42",
  source: "feed",
  at,
};

describe("ExchangeRate.from", () => {
  it("keeps the snapshot", () => {
    const rate = ExchangeRate.from(goldSar);
    expect(rate.toSnapshot()).toEqual(goldSar);
    expect(rate.at).not.toBe(goldSar.at);
  });

  it.each([
    { ...usdSar, rate: "0" },
    { ...usdSar, rate: "-3.75" },
    { ...usdSar, rate: "3,75" },
    { ...usdSar, quote: "XAU" },
    { ...usdSar, base: "usd" },
    { ...usdSar, base: "XAU" },
    { ...goldSar, unit: " " },
    { ...usdSar, source: "" },
    { ...usdSar, at: new Date(Number.NaN) },
  ])("refuses a bad snapshot %#", (snapshot) => {
    expect(() => ExchangeRate.from(snapshot)).toThrow(RangeError);
  });
});

describe("ExchangeRate#convert", () => {
  it("converts with one rounding", () => {
    const rate = ExchangeRate.from(usdSar);
    expect(rate.convert(Money.of("10.00", "USD")).toDecimal()).toBe("37.50");
    expect(rate.convert(Money.of("0.01", "USD"), Rounding.Down).toDecimal()).toBe("0.03");
  });

  it("scales across exponents", () => {
    const toKwd = ExchangeRate.from({ ...usdSar, quote: "KWD", rate: "0.3075" });
    expect(toKwd.convert(Money.of("10.00", "USD")).toDecimal()).toBe("3.075");
    const toJpy = ExchangeRate.from({ ...usdSar, quote: "JPY", rate: "151.236" });
    expect(toJpy.convert(Money.of("1.00", "USD")).toDecimal()).toBe("151");
  });

  it("refuses another base and a commodity rate", () => {
    expect(() => ExchangeRate.from(usdSar).convert(Money.of("1.00", "EUR"))).toThrow(RangeError);
    expect(() => ExchangeRate.from(goldSar).convert(Money.of("1.00", "SAR"))).toThrow(RangeError);
  });
});

describe("ExchangeRate#priceOf", () => {
  it("prices grams of fine metal exactly", () => {
    const gold = ExchangeRate.from(goldSar);
    expect(gold.priceOf("10.9375").toDecimal()).toBe("2749.91");
    expect(gold.priceOf(1, Rounding.Down).toDecimal()).toBe("251.42");
  });

  it("refuses a currency pair", () => {
    expect(() => ExchangeRate.from(usdSar).priceOf(1)).toThrow(RangeError);
  });
});
