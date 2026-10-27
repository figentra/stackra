/**
 * Stackra file contract:
 * Purpose: proves `liveRegionOf` makes warning and danger assertive alerts and every other tone a polite status, and
 *          that the live-region word always agrees with the role.
 * Boundary: pure function; no stubs.
 * Runtime: node
 * Governing contract: ADR 0312 (decision 3); WCAG 2.2 SC 4.1.3; ADR 0022 (test placement).
 */
// @covers sta-350:FR-115
import { Enum, Tone } from "@stackra/contracts";

import { liveRegionOf } from "#core/functions/live-region-of.function";

describe("liveRegionOf", () => {
  it.each(["warning", "danger"] as const)("%s interrupts", (tone) => {
    expect(liveRegionOf(tone)).toEqual({ role: "alert", "aria-live": "assertive" });
  });

  it.each(["default", "accent", "success"] as const)("%s waits its turn", (tone) => {
    expect(liveRegionOf(tone)).toEqual({ role: "status", "aria-live": "polite" });
  });

  it("never pairs an alert with polite or a status with assertive", () => {
    for (const tone of Enum.values(Tone)) {
      const { role, "aria-live": live } = liveRegionOf(tone);
      expect(live, tone).toBe(role === "alert" ? "assertive" : "polite");
    }
  });
});
