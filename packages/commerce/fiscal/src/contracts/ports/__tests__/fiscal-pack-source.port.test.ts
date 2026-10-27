/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalPackSource`: an abstract port a host implements; `section` answers a market or `null`.
 * Boundary: test only; a minimal host driver stands in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0260 (decision 9); ADR 0364.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { FiscalPackSource } from "#contracts/ports/fiscal-pack-source.port";
import type { MarketFiscalSection } from "#contracts/types/market-fiscal-section.type";

/** A host answer: one market with no mandates. */
class OneMarket extends FiscalPackSource {
  async section(market: string): Promise<MarketFiscalSection | null> {
    return market === "xx" ? { invoice: null, till: null } : null;
  }
}

describe("FiscalPackSource", () => {
  it("is a port that answers per market", async () => {
    const packs: FiscalPackSource = new OneMarket();
    expect(packs).toBeInstanceOf(Port);
    expect(await packs.section("xx", new Date(0))).toEqual({ invoice: null, till: null });
    expect(await packs.section("yy", new Date(0))).toBeNull();
  });
});
