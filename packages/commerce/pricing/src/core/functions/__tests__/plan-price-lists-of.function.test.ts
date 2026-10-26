/**
 * Stackra file contract:
 * Purpose: unit tests of `planPriceListsOf`: rows group into lists keyed by regional tier and price currency; bad and repeated rows are refused.
 * Boundary: test only; rows and pack values are test data standing in for seed-pack and market-pack records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0391; ADR 0392.
 */
import { describe, expect, it } from "@stackra/testing";

import { planPriceListsOf } from "#core/functions/plan-price-lists-of.function";

const ROWS = [
  {
    id: "low-usd-pro-m",
    regionalTier: "low",
    currency: "USD",
    tier: "pro",
    period: "month",
    amount: "29.00",
  },
  {
    id: "low-usd-pro-y",
    regionalTier: "low",
    currency: "USD",
    tier: "pro",
    period: "year",
    amount: "290.00",
  },
  {
    id: "std-sar-pro-m",
    regionalTier: "standard",
    currency: "SAR",
    tier: "pro",
    period: "month",
    amount: "199.00",
  },
];

describe("planPriceListsOf", () => {
  it("groups prices by list key", () => {
    const lists = planPriceListsOf(ROWS);
    expect(lists.map((list) => [list.key, list.prices.length])).toEqual([
      ["low:USD", 2],
      ["standard:SAR", 1],
    ]);
    expect(lists[0]?.prices[1]?.amount.toDecimal()).toBe("290.00");
  });

  it("refuses bad and repeated rows", () => {
    expect(() => planPriceListsOf([{ ...ROWS[0], period: "week" }])).toThrow(/unknown period week/);
    expect(() => planPriceListsOf([{ ...ROWS[0], tier: "" }])).toThrow(/needs text tier/);
    expect(() => planPriceListsOf([ROWS[0], { ...ROWS[0], id: "again" }])).toThrow(
      /row again repeats/,
    );
  });
});
