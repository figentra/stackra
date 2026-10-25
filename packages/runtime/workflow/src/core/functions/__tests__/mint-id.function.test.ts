/**
 * Stackra file contract:
 * Purpose: unit tests of `mintId`: a fresh id has the prefix and 26 lowercase base-32 characters and sorts after every
 *          id minted before it, within one millisecond too; an id derived from text is the same for the same text and
 *          differs for another.
 * Boundary: test only; the clock is frozen with `freezeClock` for the same-millisecond case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231 (public ids).
 */
import { describe, expect, freezeClock, it } from "@stackra/testing";

import { mintId } from "#core/functions/mint-id.function";

/** A public id: the prefix, an underscore and 26 lowercase Crockford characters. */
const SHAPE = /^wfr_[0-9a-hjkmnp-tv-z]{26}$/;

describe(mintId, () => {
  it("mints prefixed ids of 26 base-32 characters", async () => {
    expect(await mintId("wfr")).toMatch(SHAPE);
  });

  it("mints ids that sort in minting order, within one millisecond too", async () => {
    freezeClock("2026-10-25T12:00:00Z");
    const ids = [await mintId("wfr"), await mintId("wfr"), await mintId("wfr")];
    expect([...ids].sort()).toEqual(ids);
    expect(new Set(ids).size).toBe(3);
  });

  it("derives the same id from the same text", async () => {
    const id = await mintId("wfr", "orders.fulfil_order:ord_1");
    expect(id).toMatch(SHAPE);
    expect(await mintId("wfr", "orders.fulfil_order:ord_1")).toBe(id);
    expect(await mintId("wfr", "orders.fulfil_order:ord_2")).not.toBe(id);
  });
});
