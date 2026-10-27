/**
 * Stackra file contract:
 * Purpose: unit tests of `MarketPackRestrictedTenderProgramsDriver`: the Market's `payments.restricted-tenders` list in
 *          force on the clock's date gives its live programs with their flags (false when absent); planned and
 *          malformed entries are never served, and a Market whose pack lists none offers none.
 * Boundary: test only; the pack source is an in-test stand-in over a hand-made resolved pack of the made-up Market
 *           `xa`, read through the real `valueOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0370; ADR 0445.
 */
import { Clock } from "@stackra/contracts";
import type { ResolvedPack } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { PaymentPackSource } from "#contracts/ports/payment-pack-source.port";
import { MarketPackRestrictedTenderProgramsDriver } from "#node/drivers/market-pack-restricted-tender-programs.driver";

/** 2026-10-27. */
class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-27T12:00:00Z");
  }
}

/** A pack of `xa` whose program list changes on 2026-11-01. */
const PACK = {
  market: "xa",
  layers: [
    {
      market: "xa",
      version: "1.0.0",
      entries: [
        {
          key: "payments.restricted-tenders",
          from: "2026-01-01",
          value: [
            {
              code: "snap",
              ruleSet: "rule-set:grocery:tender-eligibility",
              taxExempt: true,
              captureAtFulfilment: true,
              pinEntry: true,
              status: "live",
            },
            { code: "voucher", ruleSet: "rs", status: "planned" },
            { code: "plain", ruleSet: "rs" },
            { code: "broken" },
            "snap",
          ],
        },
        { key: "payments.restricted-tenders", from: "2026-11-01", value: [] },
      ],
    },
  ],
} as unknown as ResolvedPack;

/** Packs by Market. */
class TestPackSource extends PaymentPackSource {
  async resolve(market: string): Promise<ResolvedPack> {
    return market === "xa" ? PACK : ({ market, layers: [] } as unknown as ResolvedPack);
  }

  async platformConnection(): Promise<string | undefined> {
    return undefined;
  }
}

describe("MarketPackRestrictedTenderProgramsDriver", () => {
  const programs = new MarketPackRestrictedTenderProgramsDriver(
    new TestPackSource(),
    new FixedClock(),
  );

  it("serves today's live programs with their flags", async () => {
    expect(await programs.program("xa", "snap")).toEqual({
      code: "snap",
      ruleSet: "rule-set:grocery:tender-eligibility",
      taxExempt: true,
      captureAtFulfilment: true,
      pinEntry: true,
    });
    expect(await programs.program("xa", "plain")).toEqual({
      code: "plain",
      ruleSet: "rs",
      taxExempt: false,
      captureAtFulfilment: false,
      pinEntry: false,
    });
  });

  it("never serves planned or malformed entries, or a Market without the list", async () => {
    expect(await programs.program("xa", "voucher")).toBeUndefined();
    expect(await programs.program("xa", "broken")).toBeUndefined();
    expect(await programs.program("xb", "snap")).toBeUndefined();
  });
});
