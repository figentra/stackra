/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalPackSourceFake`: answers from its map, `null` for unknown markets, replaces with `set`,
 *          and records every question.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalPackSource } from "#contracts/ports/fiscal-pack-source.port";
import { FiscalPackSourceFake } from "#testing/fiscal-pack-source.fake";

describe("FiscalPackSourceFake", () => {
  it("answers from its map and records the questions", async () => {
    const packs = FiscalPackSourceFake.with({ xx: { invoice: null, till: null } });
    const on = new Date(0);
    expect(packs).toBeInstanceOf(FiscalPackSource);
    expect(await packs.section("xx", on)).toEqual({ invoice: null, till: null });
    expect(await packs.section("yy", on)).toBeNull();
    packs.set("yy", { invoice: null, till: null });
    expect(await packs.section("yy", on)).not.toBeNull();
    expect(packs.calls("section")).toHaveLength(3);
  });
});
