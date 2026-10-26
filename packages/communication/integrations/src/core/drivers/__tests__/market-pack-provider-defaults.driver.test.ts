/**
 * Stackra file contract:
 * Purpose: unit tests of `MarketPackProviderDefaultsDriver`: the Market's `providers.<capability>` list in force on the
 *          clock's date gives live providers in order with their platform Connection for that capability (none for a
 *          BYO-only one), skips planned, malformed and repeated entries, reads one capability's list only, and a Market
 *          whose pack lists none offers none.
 * Boundary: test only; the pack source is an in-test stand-in over a hand-made resolved pack of the made-up Market
 *           `xa`, read through the real `valueOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0370; ADR 0422 (decision 3).
 */
import { Clock } from "@stackra/contracts";
import type { ResolvedPack } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { ProviderDefaults } from "#contracts/ports/provider-defaults.port";
import { ProviderPackSource } from "#core/ports/provider-pack-source.port";
import { MarketPackProviderDefaultsDriver } from "#core/drivers/market-pack-provider-defaults.driver";

/** 2026-10-26. */
class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-26T12:00:00Z");
  }
}

/** A pack of `xa` whose SMS list changes on 2026-11-01, with a WhatsApp list beside it. */
const PACK = {
  market: "xa",
  layers: [
    {
      market: "xa",
      version: "1.0.0",
      entries: [
        {
          key: "providers.sms",
          from: "2026-01-01",
          value: [
            { provider: "alpha", status: "live" },
            { provider: "beta", status: "planned" },
            "gamma",
            { status: "live" },
            42,
            "alpha",
          ],
        },
        { key: "providers.sms", from: "2026-11-01", value: ["later"] },
        { key: "providers.whatsapp", from: "2026-01-01", value: ["delta"] },
      ],
    },
  ],
} as unknown as ResolvedPack;

/** Packs by Market, and the platform Connection of `alpha` for SMS only. */
class TestPackSource extends ProviderPackSource {
  async resolve(market: string): Promise<ResolvedPack> {
    return market === "xa" ? PACK : ({ market, layers: [] } as unknown as ResolvedPack);
  }

  async platformConnection(
    capability: string,
    _market: string,
    provider: string,
  ): Promise<string | undefined> {
    return capability === "sms" && provider === "alpha" ? "conn_platform_alpha" : undefined;
  }
}

describe("MarketPackProviderDefaultsDriver", () => {
  const defaults = new MarketPackProviderDefaultsDriver(new TestPackSource(), new FixedClock());

  it("is a ProviderDefaults", () => {
    expect(defaults).toBeInstanceOf(ProviderDefaults);
  });

  it("lists today's live providers of the capability in order, each with its platform Connection", async () => {
    expect(await defaults.providers("sms", "xa")).toEqual([
      { provider: "alpha", connectionId: "conn_platform_alpha" },
      { provider: "gamma" },
    ]);
    expect(await defaults.providers("whatsapp", "xa")).toEqual([{ provider: "delta" }]);
  });

  it("offers nothing where the pack lists nothing", async () => {
    expect(await defaults.providers("voice", "xa")).toEqual([]);
    expect(await defaults.providers("sms", "xb")).toEqual([]);
  });
});
