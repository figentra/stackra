/**
 * Stackra file contract:
 * Purpose: unit tests of `zonedTime`: local date, 24-hour time and offset in a named zone, and a refusal for an unknown
 *          zone.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { zonedTime } from "#core/functions/zoned-time.function";

describe("zonedTime", () => {
  it("shows the zone's wall clock and offset", () => {
    expect(zonedTime(new Date("2026-01-01T22:30:05Z"), "Asia/Riyadh")).toEqual({
      date: "2026-01-02",
      time: "01:30:05",
      offset: "+03:00",
    });
    expect(zonedTime(new Date("2026-07-01T12:00:00Z"), "Europe/Madrid").offset).toBe("+02:00");
  });

  it("writes UTC as +00:00 and midnight as 00", () => {
    expect(zonedTime(new Date("2026-01-01T00:00:00Z"), "UTC")).toEqual({
      date: "2026-01-01",
      time: "00:00:00",
      offset: "+00:00",
    });
  });

  it("refuses an unknown zone", () => {
    expect(() => zonedTime(new Date(0), "Not/AZone")).toThrow(RangeError);
  });
});
