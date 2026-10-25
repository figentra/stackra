/**
 * Stackra file contract:
 * Purpose: unit tests of `isExpiringSoon`: true strictly inside the thirty-day window (a past expiry included), false
 *          at or beyond it and with no expiry.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { isExpiringSoon } from "#core/functions/is-expiring-soon.function";

/** The instant the renderer read. */
const NOW = Date.parse("2026-10-21T00:00:00Z");

describe("isExpiringSoon", () => {
  it("is true inside the thirty-day window and for a past expiry", () => {
    expect(isExpiringSoon(new Date("2026-11-01T00:00:00Z"), NOW)).toBe(true);
    expect(isExpiringSoon(new Date("2026-10-01T00:00:00Z"), NOW)).toBe(true);
  });

  it("is false at thirty days or more, and with no expiry", () => {
    expect(isExpiringSoon(new Date("2026-11-20T00:00:00Z"), NOW)).toBe(false);
    expect(isExpiringSoon(new Date("2027-01-21T00:00:00Z"), NOW)).toBe(false);
    expect(isExpiringSoon(null, NOW)).toBe(false);
    expect(isExpiringSoon(undefined, NOW)).toBe(false);
  });
});
