/**
 * Stackra file contract:
 * Purpose: unit tests of `mintEventId`: an `evt_` id of 26 Crockford characters whose first ten encode the time; ids
 *          minted in one millisecond, or after the clock stepped back, still sort in minting order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0135 (public ids).
 */
import { describe, expect, it } from "@stackra/testing";

import { mintEventId } from "#core/functions/mint-event-id.function";

const NOON = Date.UTC(2026, 9, 25, 12);

describe(mintEventId, () => {
  it("mints an evt_ id of 26 Crockford characters", () => {
    expect(mintEventId(NOON)).toMatch(/^evt_[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("encodes the time in the first ten characters", () => {
    const early = mintEventId(NOON + 1_000);
    const late = mintEventId(NOON + 2_000);
    expect(early.slice(4, 14) < late.slice(4, 14)).toBe(true);
  });

  it("sorts in minting order within one millisecond and when the clock steps back", () => {
    const ids = [
      mintEventId(NOON + 5_000),
      mintEventId(NOON + 5_000),
      mintEventId(NOON + 5_000),
      mintEventId(NOON + 4_000),
    ];
    expect(new Set(ids).size).toBe(4);
    expect([...ids].sort()).toEqual(ids);
  });
});
