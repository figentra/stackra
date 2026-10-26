/**
 * Stackra file contract:
 * Purpose: unit tests of `mintAccessEventId`: `evt_` and 26 Crockford base32 characters, fresh on every call.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0135; ADR 0141 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { mintAccessEventId } from "#core/functions/mint-access-event-id.function";

describe(mintAccessEventId, () => {
  it("mints a fresh evt_ id", () => {
    const ids = new Set(Array.from({ length: 50 }, () => mintAccessEventId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(/^evt_[0-9a-hjkmnp-tv-z]{26}$/);
  });
});
