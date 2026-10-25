/**
 * Stackra file contract:
 * Purpose: `FiscalPackSourceFake`, a `FiscalPackSource` that answers from a fixed map of market sections and records
 *          every question.
 * Boundary: built on `Fake` of @stackra/testing; the date is recorded but not used, so a test that needs a dated
 *           change swaps the map with `set`.
 * Runtime: isomorphic
 * Governing contract: ADR 0269; ADR 0266 (decision 2: a fake per capability); ADR 0364.
 */
import { Fake } from "@stackra/testing";

import { FiscalPackSource } from "#contracts/ports/fiscal-pack-source.port";
import type { MarketFiscalSection } from "#contracts/types/market-fiscal-section.type";

/**
 * Answers `section` from `sections`; unknown markets answer `null`.
 *
 * @example
 * const till = { driver: "tse", options, reportingWindowHours: null, retentionYears: null };
 * const packs = FiscalPackSourceFake.with({ xx: { invoice: null, till } });
 */
export class FiscalPackSourceFake extends Fake.of(FiscalPackSource) {
  /** Sections by market code. */
  private readonly sections: Map<string, MarketFiscalSection>;

  /** @param sections - sections by market code. */
  constructor(sections: Map<string, MarketFiscalSection>) {
    super();
    this.sections = sections;
  }

  /** Shorthand for a fake over a plain object. */
  static with(sections: Readonly<Record<string, MarketFiscalSection>>): FiscalPackSourceFake {
    return new FiscalPackSourceFake(new Map(Object.entries(sections)));
  }

  /** Replaces one market's section. */
  set(market: string, section: MarketFiscalSection): void {
    this.sections.set(market, section);
  }

  /** Recorded, then answered from the map. */
  async section(market: string, on: Date): Promise<MarketFiscalSection | null> {
    this.record("section", { market, on });
    return this.sections.get(market) ?? null;
  }
}
