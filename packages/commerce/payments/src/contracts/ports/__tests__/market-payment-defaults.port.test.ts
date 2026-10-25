/**
 * Stackra file contract:
 * Purpose: unit tests of `MarketPaymentDefaults`: an abstract port the market-pack loader implements, answering a
 *          Market's providers in order.
 * Boundary: test only; a minimal host class stands in for a driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0356 (decision 5).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { MarketPaymentDefaults } from "#contracts/ports/market-payment-defaults.port";
import type { ProviderChoice } from "#contracts/types/provider-choice.type";

/** A Market list a test writes: one provider for every Market. */
class OneProvider extends MarketPaymentDefaults {
  async providers(): Promise<readonly ProviderChoice[]> {
    return [{ provider: "stripe", connectionId: "conn_1" }];
  }
}

describe("MarketPaymentDefaults", () => {
  it("is an abstract port that answers a Market's providers", async () => {
    const defaults = new OneProvider();
    expect(defaults).toBeInstanceOf(Port);
    expect(await defaults.providers("any")).toEqual([
      { provider: "stripe", connectionId: "conn_1" },
    ]);
  });

  it("takes the Market code", () => {
    expectTypeOf<Parameters<MarketPaymentDefaults["providers"]>[0]>().toEqualTypeOf<string>();
  });
});
