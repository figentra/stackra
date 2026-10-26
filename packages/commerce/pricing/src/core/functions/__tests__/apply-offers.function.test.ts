/**
 * Stackra file contract:
 * Purpose: unit tests of `applyOffers`: percentages compound with the caller's rounding, benefits stop after their months, credit and module grants and the free migration are reported.
 * Boundary: test only; rows are test data standing in for `offer:<name>` and `rate-card:<name>` seed records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0393 (decision 2); owner M3-6, RV-52.
 */
import { Money, Rounding } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { applyOffers } from "#core/functions/apply-offers.function";

import { OFFERS } from "./offer-fixtures";

const PRICE = Money.of("100.00", "USD");

describe("applyOffers", () => {
  it("compounds the percentages in force and lists the grants", () => {
    const outcome = applyOffers(PRICE, [OFFERS.startup, OFFERS.annual], 0);
    expect(outcome.price.toDecimal()).toBe("40.00");
    expect(outcome.credits).toEqual([
      { kind: "credit_grant", credit: "ai", units: 500, period: "month", months: 12 },
    ]);
    expect(outcome.modules).toEqual(["crm"]);
    expect(outcome.freeMigration).toBe(true);
  });

  it("drops benefits whose months have run out", () => {
    const outcome = applyOffers(PRICE, [OFFERS.startup, OFFERS.annual], 12);
    expect(outcome.price.toDecimal()).toBe("80.00");
    expect([outcome.credits, outcome.modules]).toEqual([[], []]);
  });

  it("rounds with the caller's rounding and refuses a bad month", () => {
    expect(
      applyOffers(Money.of("0.05", "USD"), [OFFERS.startup], 0, Rounding.Up).price.toDecimal(),
    ).toBe("0.03");
    expect(() => applyOffers(PRICE, [], -1)).toThrow(RangeError);
    expect(applyOffers(PRICE, [], 0)).toEqual({
      price: PRICE,
      credits: [],
      modules: [],
      freeMigration: false,
    });
  });
});
