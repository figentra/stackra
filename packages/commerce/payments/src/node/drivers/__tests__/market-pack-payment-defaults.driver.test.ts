/**
 * Stackra file contract:
 * Purpose: unit tests of `MarketPackPaymentDefaultsDriver`: the Market's `payments.byo-providers` list in force on the
 *          clock's date gives live providers in order with their platform Connection (none for a BYO-only one),
 *          skips planned, malformed and repeated entries, and a Market whose pack lists none offers none.
 * Boundary: test only; the pack source is an in-test stand-in over a hand-made resolved pack of the made-up Market
 *           `xa`, read through the real `valueOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0370; R4-4.
 */
import { Clock } from "@stackra/contracts";
import type { ResolvedPack } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { PaymentPackSource } from "#contracts/ports/payment-pack-source.port";
import { MarketPackPaymentDefaultsDriver } from "#node/drivers/market-pack-payment-defaults.driver";

/** 2026-10-26. */
class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-26T12:00:00Z");
  }
}

/** A pack of `xa` whose provider list changes on 2026-11-01. */
const PACK = {
  market: "xa",
  layers: [
    {
      market: "xa",
      version: "1.0.0",
      entries: [
        {
          key: "payments.byo-providers",
          from: "2026-01-01",
          value: [
            { provider: "stripe", status: "live" },
            { provider: "adyen", status: "planned" },
            "gateway-x",
            { status: "live" },
            42,
            "stripe",
          ],
        },
        { key: "payments.byo-providers", from: "2026-11-01", value: ["later"] },
      ],
    },
  ],
} as unknown as ResolvedPack;

/** Packs by Market, and the platform Connection of `stripe` only. */
class TestPackSource extends PaymentPackSource {
  async resolve(market: string): Promise<ResolvedPack> {
    return market === "xa" ? PACK : ({ market, layers: [] } as unknown as ResolvedPack);
  }

  async platformConnection(_market: string, provider: string): Promise<string | undefined> {
    return provider === "stripe" ? "conn_platform_stripe" : undefined;
  }
}

describe("MarketPackPaymentDefaultsDriver", () => {
  it("lists today's live providers in order, each with its platform Connection when there is one", async () => {
    const defaults = new MarketPackPaymentDefaultsDriver(new TestPackSource(), new FixedClock());
    expect(await defaults.providers("xa")).toEqual([
      { provider: "stripe", connectionId: "conn_platform_stripe" },
      { provider: "gateway-x" },
    ]);
  });

  it("offers nothing where the pack lists nothing", async () => {
    const defaults = new MarketPackPaymentDefaultsDriver(new TestPackSource(), new FixedClock());
    expect(await defaults.providers("xb")).toEqual([]);
  });
});
