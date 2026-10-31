/**
 * Stackra file contract:
 * Purpose: unit tests of `addCalendarMonths`: month-end clamping with and without an anchor day, negative months, year
 *          rollover, UTC and zones with and without daylight saving, a spring-forward gap, a fall-back ambiguity, and
 *          the RangeError guards.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); STA-1725.
 */
import { describe, expect, it } from "@stackra/testing";

import { addCalendarMonths } from "#core/functions/add-calendar-months.function";

/** `addCalendarMonths` over ISO strings, the result as an ISO string. */
const add = (iso: string, months: number, zone: string, anchorDay?: number): string =>
  addCalendarMonths(new Date(iso), months, zone, anchorDay).toISOString();

describe("addCalendarMonths", () => {
  it("clamps 31 Jan plus one month to the end of February, leap or not", () => {
    expect(add("2026-01-31T10:00:00.000Z", 1, "UTC")).toBe("2026-02-28T10:00:00.000Z");
    expect(add("2028-01-31T10:00:00.000Z", 1, "UTC")).toBe("2028-02-29T10:00:00.000Z");
  });

  it("keeps the anchor day across later months", () => {
    const jan = "2026-01-31T10:00:00.000Z";
    expect(add(jan, 2, "UTC", 31)).toBe("2026-03-31T10:00:00.000Z");
    expect(add(jan, 3, "UTC", 31)).toBe("2026-04-30T10:00:00.000Z");
    // Chained without the anchor the day drifts, which is why the anchor exists.
    expect(add(add(jan, 1, "UTC"), 1, "UTC")).toBe("2026-03-28T10:00:00.000Z");
    expect(add(add(jan, 1, "UTC", 31), 1, "UTC", 31)).toBe("2026-03-31T10:00:00.000Z");
  });

  it("clamps 30 Nov plus three months to the end of February", () => {
    expect(add("2025-11-30T10:00:00.000Z", 3, "UTC")).toBe("2026-02-28T10:00:00.000Z");
    expect(add("2027-11-30T10:00:00.000Z", 3, "UTC")).toBe("2028-02-29T10:00:00.000Z");
  });

  it("subtracts with a negative count", () => {
    expect(add("2026-03-31T10:00:00.000Z", -1, "UTC")).toBe("2026-02-28T10:00:00.000Z");
    expect(add("2026-01-15T10:00:00.000Z", -2, "UTC")).toBe("2025-11-15T10:00:00.000Z");
    expect(add("2026-01-15T10:00:00.000Z", 0, "UTC")).toBe("2026-01-15T10:00:00.000Z");
  });

  it("rolls the year over in both directions", () => {
    expect(add("2026-12-15T10:00:00.000Z", 1, "UTC")).toBe("2027-01-15T10:00:00.000Z");
    expect(add("2027-01-15T10:00:00.000Z", -1, "UTC")).toBe("2026-12-15T10:00:00.000Z");
    expect(add("2026-12-15T10:00:00.000Z", 25, "UTC")).toBe("2029-01-15T10:00:00.000Z");
  });

  it("keeps the milliseconds and does not mutate the input", () => {
    const input = new Date("2026-01-31T10:00:00.123Z");
    expect(addCalendarMonths(input, 1, "UTC").toISOString()).toBe("2026-02-28T10:00:00.123Z");
    expect(input.toISOString()).toBe("2026-01-31T10:00:00.123Z");
  });

  it("reads the day in the zone, not in UTC (Asia/Dubai has no daylight saving)", () => {
    expect(add("2026-01-31T10:00:00.000Z", 1, "Asia/Dubai")).toBe("2026-02-28T10:00:00.000Z");
    // 22:00Z on 31 Jan is 02:00 on 1 Feb in Dubai, so one month later is 1 Mar 02:00 there.
    expect(add("2026-01-31T22:00:00.000Z", 1, "Asia/Dubai")).toBe("2026-02-28T22:00:00.000Z");
  });

  it("keeps the wall-clock time across a daylight-saving change", () => {
    // 11:00 CET on 31 Jan becomes 11:00 CEST on 31 Mar, which is 09:00Z.
    expect(add("2026-01-31T10:00:00.000Z", 2, "Europe/Berlin")).toBe("2026-03-31T09:00:00.000Z");
  });

  it("moves a wall time in a spring-forward gap to the first valid instant", () => {
    // 29 Mar 2026: 02:00 CET jumps to 03:00 CEST (01:00Z). 02:30 on 29 Jan is 01:30Z.
    const jan = "2026-01-29T01:30:00.000Z";
    expect(add(jan, 2, "Europe/Berlin")).toBe("2026-03-29T01:00:00.000Z");
    // The same 02:30 a month later exists again, at its own offset.
    expect(add(jan, 3, "Europe/Berlin")).toBe("2026-04-29T00:30:00.000Z");
  });

  it("takes the earlier offset for an ambiguous wall time", () => {
    // 25 Oct 2026: 03:00 CEST falls back to 02:00 CET, so 02:30 happens at 00:30Z and again at 01:30Z.
    const sep = "2026-09-25T00:30:00.000Z";
    expect(add(sep, 1, "Europe/Berlin")).toBe("2026-10-25T00:30:00.000Z");
  });

  it("refuses an unknown zone, an invalid date and non-whole numbers", () => {
    const now = new Date("2026-01-31T10:00:00.000Z");
    expect(() => addCalendarMonths(now, 1, "Nowhere/Atlantis")).toThrow(RangeError);
    expect(() => addCalendarMonths(new Date(Number.NaN), 1, "UTC")).toThrow(RangeError);
    expect(() => addCalendarMonths(now, 1.5, "UTC")).toThrow(RangeError);
    expect(() => addCalendarMonths(now, Number.NaN, "UTC")).toThrow(RangeError);
    expect(() => addCalendarMonths(now, 1, "UTC", 0)).toThrow(RangeError);
    expect(() => addCalendarMonths(now, 1, "UTC", 32)).toThrow(RangeError);
    expect(() => addCalendarMonths(now, 1, "UTC", 1.5)).toThrow(RangeError);
  });
});
