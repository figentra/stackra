/**
 * Stackra file contract:
 * Purpose: unit tests of `needsGuardianConsent`: below the age a guardian is needed, from the birthday on not; a
 *          29 February birthday counts from 1 March in a common year; malformed input is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; OS-284.
 */
import { describe, expect, it } from "@stackra/testing";

import { needsGuardianConsent } from "#core/functions/needs-guardian-consent.function";

describe("needsGuardianConsent", () => {
  it("needs a guardian until the birthday that reaches the age", () => {
    expect(needsGuardianConsent("2010-10-26", "2026-10-25", 16)).toBe(true);
    expect(needsGuardianConsent("2010-10-25", "2026-10-25", 16)).toBe(false);
    expect(needsGuardianConsent("2000-01-01", "2026-10-25", 0)).toBe(false);
  });

  it("counts a 29 February birthday from 1 March in a common year", () => {
    expect(needsGuardianConsent("2008-02-29", "2026-02-28", 18)).toBe(true);
    expect(needsGuardianConsent("2008-02-29", "2026-03-01", 18)).toBe(false);
  });

  it("refuses malformed dates and ages", () => {
    expect(() => needsGuardianConsent("25/10/2010", "2026-10-25", 16)).toThrow(RangeError);
    expect(() => needsGuardianConsent("2010-10-25", "2026-10-25", 15.5)).toThrow(RangeError);
  });
});
