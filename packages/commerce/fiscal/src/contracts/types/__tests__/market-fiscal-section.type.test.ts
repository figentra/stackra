/**
 * Stackra file contract:
 * Purpose: type tests of `MarketFiscalSection`: both channels are present, each a mandate or `null`.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { MarketFiscalSection } from "#contracts/types/market-fiscal-section.type";

describe("MarketFiscalSection", () => {
  it("takes a market with only a till rule, and refuses a missing channel", () => {
    const section: MarketFiscalSection = {
      invoice: null,
      till: { driver: "nf525", options: {}, reportingWindowHours: null, retentionYears: null },
    };
    // @ts-expect-error -- both channels are stated
    const partial: MarketFiscalSection = { invoice: null };
    expect([section.till?.driver, partial.invoice]).toEqual(["nf525", null]);
  });
});
