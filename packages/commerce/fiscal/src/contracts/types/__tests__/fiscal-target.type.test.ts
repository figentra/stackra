/**
 * Stackra file contract:
 * Purpose: type tests of `FiscalTarget`: a target names a market, a channel code and a unit.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalChannel } from "#contracts/enums/fiscal-channel.enum";
import type { FiscalTarget } from "#contracts/types/fiscal-target.type";

describe("FiscalTarget", () => {
  it("takes a channel code and refuses another string", () => {
    const target: FiscalTarget = { market: "xx", channel: FiscalChannel.Till, unitId: "till_1" };
    // @ts-expect-error -- the channel is one of the enum's codes
    const other: FiscalTarget = { market: "xx", channel: "pos", unitId: "till_1" };
    expect([target.channel, other.channel]).toEqual(["till", "pos"]);
  });
});
