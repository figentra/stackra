/**
 * Stackra file contract:
 * Purpose: unit tests of `MarketPaymentDefaultsFake`: a written Market answers its providers, any other Market none.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { MarketPaymentDefaults } from "#contracts/ports/market-payment-defaults.port";
import { MarketPaymentDefaultsFake } from "#testing/market-payment-defaults.fake";

describe("MarketPaymentDefaultsFake", () => {
  it("answers the written Market and nothing for others", async () => {
    const defaults = MarketPaymentDefaultsFake.with({
      m1: [{ provider: "stripe", connectionId: "conn_1" }],
    });
    expect(defaults).toBeInstanceOf(MarketPaymentDefaults);
    expect(await defaults.providers("m1")).toEqual([
      { provider: "stripe", connectionId: "conn_1" },
    ]);
    expect(await defaults.providers("m2")).toEqual([]);
  });
});
