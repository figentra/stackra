/**
 * Stackra file contract:
 * Purpose: unit tests of `planPrice and priceListKey`: the price comes from the list keyed by the terms' regional tier and price currency; a missing price is refused.
 * Boundary: test only; rows and pack values are test data standing in for seed-pack and market-pack records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0392 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { BillingPeriod } from "#core/enums/billing-period.enum";
import { planPrice } from "#core/functions/plan-price.function";
import { planPriceListsOf } from "#core/functions/plan-price-lists-of.function";
import { priceListKey } from "#core/functions/price-list-key.function";

const lists = planPriceListsOf([
  { id: "a", regionalTier: "low", currency: "USD", tier: "pro", period: "month", amount: "29.00" },
  {
    id: "b",
    regionalTier: "low",
    currency: "EGP",
    tier: "pro",
    period: "month",
    amount: "1450.00",
  },
]);

describe("planPrice", () => {
  it("keys a list by regional tier and price currency", () => {
    expect(priceListKey("low", "USD")).toBe("low:USD");
  });

  it("reads the price on the terms' list", () => {
    const terms = { regionalTier: "low", priceCurrency: "USD" as const };
    expect(planPrice(lists, terms, "pro", BillingPeriod.Month).toDecimal()).toBe("29.00");
    expect(() => planPrice(lists, terms, "pro", BillingPeriod.Year)).toThrow(
      /no year price for pro on low:USD/,
    );
  });
});
