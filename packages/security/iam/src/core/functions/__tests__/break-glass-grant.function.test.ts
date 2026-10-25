/**
 * Stackra file contract:
 * Purpose: unit tests of `breakGlassGrant`: a grant inside the longest duration with a reason is returned trimmed; a
 *          blank reason, an empty or too long window, and a self-approval are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; OS-21; JUR-335; STA-595.
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { breakGlassGrant } from "#core/functions/break-glass-grant.function";

const base = {
  role: "partner",
  scope: { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.firm" },
  reason: "  urgent filing  ",
  openedBy: "usr_01j9z3k4m5n6p7q8r9s0t1v2a1",
  startsAt: new Date("2026-10-25T09:00:00Z"),
  expiresAt: new Date("2026-10-25T10:00:00Z"),
} as const;

describe("breakGlassGrant", () => {
  it("returns a checked grant with its reason trimmed", () => {
    expect(breakGlassGrant(base, Duration.hours(2)).reason).toBe("urgent filing");
  });

  it("refuses a blank reason, a bad window and a self-approval", () => {
    expect(() => breakGlassGrant({ ...base, reason: " " }, Duration.hours(2))).toThrow(RangeError);
    expect(() => breakGlassGrant({ ...base, expiresAt: base.startsAt }, Duration.hours(2))).toThrow(
      RangeError,
    );
    expect(() => breakGlassGrant(base, Duration.minutes(30))).toThrow(RangeError);
    expect(() =>
      breakGlassGrant({ ...base, approvedBy: base.openedBy }, Duration.hours(2)),
    ).toThrow(RangeError);
  });
});
