/**
 * Stackra file contract:
 * Purpose: unit tests of `mintScheduleId`: a `sch_` public id of 26 Crockford base32 characters, unique per call and
 *          ordered by creation time.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0135.
 */
import { describe, expect, it } from "@stackra/testing";

import { mintScheduleId } from "#core/functions/mint-schedule-id.function";

describe(mintScheduleId, () => {
  it("mints a sch_ public id in Crockford base32", () => {
    expect(mintScheduleId()).toMatch(/^sch_[0-9a-hjkmnp-tv-z]{26}$/);
  });

  it("never repeats and sorts by creation time", async () => {
    const first = mintScheduleId();
    await new Promise((resolve) => {
      setTimeout(resolve, 2);
    });
    const second = mintScheduleId();
    expect(second).not.toBe(first);
    expect([second, first].sort()).toEqual([first, second]);
  });
});
