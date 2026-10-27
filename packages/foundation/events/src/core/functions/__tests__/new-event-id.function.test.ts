/**
 * Stackra file contract:
 * Purpose: unit tests of `newEventId`: `evt_` plus 26 lowercase Crockford base32 characters (the `mintPublicId`
 *          form), new and increasing per call, and a repeated random part under `freezeIds()` and `freezeClock()`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0135 (public ids); ADR 0269 (ids are frozen in tests);
 *                     STA-1380 (one public-id minter).
 */
import { describe, expect, freezeClock, freezeIds, it } from "@stackra/testing";

import { newEventId } from "#core/functions/new-event-id.function";

describe(newEventId, () => {
  it("is evt_ and 26 lowercase Crockford characters, new and later per call", () => {
    const id = newEventId();
    expect(id).toMatch(/^evt_[0-9a-hjkmnp-tv-z]{26}$/);
    const next = newEventId();
    expect(next).not.toBe(id);
    expect(next > id).toBe(true);
  });

  it("draws the same random part under frozen ids", () => {
    // Far-future instants, so the process's earlier mints never force an increment.
    freezeClock("2099-06-01T09:00:00Z");
    freezeIds();
    const first = newEventId();
    freezeClock("2099-06-02T09:00:00Z");
    freezeIds();
    // The last 16 characters are the 80 bits after the 48-bit time.
    expect(newEventId().slice(-16)).toBe(first.slice(-16));
  });
});
