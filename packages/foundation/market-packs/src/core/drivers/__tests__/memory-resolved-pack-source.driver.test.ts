/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryResolvedPackSourceDriver`: a `ResolvedPackSource` that serves a frozen copy of the packs
 *          it was given, none by default.
 * Boundary: test only. Pack data is made up (`xa`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0418.
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryResolvedPackSourceDriver } from "#core/drivers/memory-resolved-pack-source.driver";
import { PackStatus } from "#core/enums/pack-status.enum";
import { ResolvedPackSource } from "#core/ports/resolved-pack-source.port";
import type { MarketPack } from "#core/types/market-pack.type";

const PACK: MarketPack = {
  market: "xa",
  version: "1.0.0",
  status: PackStatus.Live,
  entries: [{ key: "billing.currency", value: "XAA", from: "2000-01-01" }],
  reviews: [],
  checklist: [],
};

describe("MemoryResolvedPackSourceDriver", () => {
  it("serves a frozen copy of its packs", async () => {
    const given = [PACK];
    const source = new MemoryResolvedPackSourceDriver().use(given);
    given.pop();
    expect(source).toBeInstanceOf(ResolvedPackSource);
    const packs = await source.packs();
    expect(packs).toEqual([PACK]);
    expect(Object.isFrozen(packs)).toBe(true);
    expect((await source.valueFor("xa", "billing.currency"))?.value).toBe("XAA");
  });

  it("serves nothing by default", async () => {
    await expect(new MemoryResolvedPackSourceDriver().packs()).resolves.toEqual([]);
  });
});
