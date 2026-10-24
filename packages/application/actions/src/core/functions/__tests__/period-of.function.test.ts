/**
 * Stackra file contract:
 * Purpose: unit tests of `periodOf`: each named range (`today`, `last_7_days`, `last_30_days`, `this_month`) in a
 *          zone, the default (today), a custom window, the previous window of equal length, and the refusals of an
 *          unknown range and an empty window.
 * Boundary: test only; the clock reading is passed in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (time ranges and the previous period).
 */
import { describe, expect, it } from "@stackra/testing";

import { periodOf } from "#core/functions/period-of.function";

const now = new Date("2026-10-24T10:00:00Z");

describe(periodOf, () => {
  it("covers today, by default too", () => {
    const today = periodOf({ range: "today" }, now, "Asia/Riyadh");
    expect(today.from.toISOString()).toBe("2026-10-23T21:00:00.000Z");
    expect(today.to.toISOString()).toBe("2026-10-24T21:00:00.000Z");
    expect(today.days).toBe(1);
    expect(today.previous.from.toISOString()).toBe("2026-10-22T21:00:00.000Z");
    expect(today.previous.to).toEqual(today.from);
    expect(periodOf({}, now, "Asia/Riyadh")).toEqual(today);
    expect(periodOf({ range: null, from: null }, now, "Asia/Riyadh")).toEqual(today);
  });

  it("covers the last 7 and 30 days including today", () => {
    const week = periodOf({ range: "last_7_days" }, now, "UTC");
    expect(week.from.toISOString()).toBe("2026-10-18T00:00:00.000Z");
    expect(week.to.toISOString()).toBe("2026-10-25T00:00:00.000Z");
    expect(week.days).toBe(7);
    expect(periodOf({ range: "last_30_days" }, now, "UTC").days).toBe(30);
  });

  it("covers this month", () => {
    const month = periodOf({ range: "this_month" }, now, "UTC");
    expect(month.from.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(month.to.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(month.days).toBe(31);
  });

  it("takes a custom window, ending now when `to` is absent", () => {
    const from = new Date("2026-10-20T00:00:00Z");
    expect(periodOf({ from, to: new Date("2026-10-22T00:00:00Z") }, now, "UTC").days).toBe(2);
    expect(periodOf({ from }, now, "UTC").to).toEqual(now);
  });

  it("refuses an unknown range and an empty window", () => {
    expect(() => periodOf({ range: "fortnight" }, now, "UTC")).toThrow(RangeError);
    expect(() => periodOf({ from: now, to: now }, now, "UTC")).toThrow(RangeError);
  });
});
