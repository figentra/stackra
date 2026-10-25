/**
 * Stackra file contract:
 * Purpose: unit tests of `startOfZonedDay`: local midnight in UTC, east and west of UTC, on both sides of a
 *          daylight-saving change, the first of the month, and a refused unknown zone.
 * Boundary: test only; relies on the runtime's ICU time-zone data (full ICU ships with Node).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0136 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { startOfZonedDay } from "#core/functions/start-of-zoned-day.function";

const at = (iso: string) => new Date(iso);

describe(startOfZonedDay, () => {
  it("finds local midnight east and west of UTC", () => {
    expect(startOfZonedDay(at("2026-10-24T15:00:00Z"), "UTC").toISOString()).toBe(
      "2026-10-24T00:00:00.000Z",
    );
    // 01:30 on the 25th in Riyadh (UTC+3)
    expect(startOfZonedDay(at("2026-10-24T22:30:00Z"), "Asia/Riyadh").toISOString()).toBe(
      "2026-10-24T21:00:00.000Z",
    );
    // 20:00 on the 23rd in New York (UTC-4 in October)
    expect(startOfZonedDay(at("2026-10-24T00:00:00Z"), "America/New_York").toISOString()).toBe(
      "2026-10-23T04:00:00.000Z",
    );
  });

  it("lands on midnight on the days of a daylight-saving change", () => {
    // New York leaves daylight time on 2026-11-01 at 02:00; midnight is still daylight time (UTC-4)
    expect(startOfZonedDay(at("2026-11-01T18:00:00Z"), "America/New_York").toISOString()).toBe(
      "2026-11-01T04:00:00.000Z",
    );
    // the next day starts in standard time (UTC-5)
    expect(startOfZonedDay(at("2026-11-02T18:00:00Z"), "America/New_York").toISOString()).toBe(
      "2026-11-02T05:00:00.000Z",
    );
  });

  it("finds the first of the month", () => {
    expect(startOfZonedDay(at("2026-10-24T15:00:00Z"), "Asia/Riyadh", "month").toISOString()).toBe(
      "2026-09-30T21:00:00.000Z",
    );
  });

  it("refuses an unknown time zone", () => {
    expect(() => startOfZonedDay(at("2026-10-24T15:00:00Z"), "Mars/Olympus")).toThrow(RangeError);
  });
});
