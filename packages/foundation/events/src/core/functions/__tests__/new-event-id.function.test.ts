/**
 * Stackra file contract:
 * Purpose: unit tests of `newEventId`: `evt_` plus 26 Crockford base-32 characters, different per call, and repeated
 *          under `freezeIds()`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0135 (public ids); ADR 0269 (ids are frozen in tests).
 */
import { describe, expect, freezeIds, it } from "@stackra/testing";

import { newEventId } from "#core/functions/new-event-id.function";

describe(newEventId, () => {
  it("is evt_ and 26 Crockford characters, new per call", () => {
    const id = newEventId();
    expect(id).toMatch(/^evt_[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(newEventId()).not.toBe(id);
  });

  it("repeats under freezeIds", () => {
    freezeIds();
    const first = newEventId();
    freezeIds();
    expect(newEventId()).toBe(first);
  });
});
