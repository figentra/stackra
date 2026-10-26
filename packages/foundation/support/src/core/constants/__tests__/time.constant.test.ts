/**
 * Stackra file contract:
 * Purpose: unit tests of the `time` helpers: every shift in both directions, immutability, fractional and negative
 *          amounts, the UTC and daylight-saving edges, and the RangeError guard on invalid input.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import { time } from "#core/constants/time.constant";

const at = (iso: string): Date => new Date(iso);
const iso = (date: Date): string => date.toISOString();

describe("time", () => {
  const start = at("2026-10-24T12:00:00.000Z");

  it.each([
    ["addSeconds", 90, "2026-10-24T12:01:30.000Z"],
    ["subSeconds", 90, "2026-10-24T11:58:30.000Z"],
    ["addMinutes", 45, "2026-10-24T12:45:00.000Z"],
    ["subMinutes", 45, "2026-10-24T11:15:00.000Z"],
    ["addHours", 13, "2026-10-25T01:00:00.000Z"],
    ["subHours", 13, "2026-10-23T23:00:00.000Z"],
    ["addDays", 10, "2026-11-03T12:00:00.000Z"],
    ["subDays", 30, "2026-09-24T12:00:00.000Z"],
  ] as const)("%s(start, %d) is %s", (name, amount, expected) => {
    expect(iso(time[name](start, amount))).toBe(expected);
  });

  it("computes the template's cutoff: subMinutes over the action clock", () => {
    expect(iso(time.subMinutes(at("2026-10-24T00:10:00.000Z"), 30))).toBe(
      "2026-10-23T23:40:00.000Z",
    );
  });

  it("returns a new Date and leaves the input untouched", () => {
    const input = at("2026-10-24T12:00:00.000Z");
    const result = time.addMinutes(input, 5);
    expect(result).not.toBe(input);
    expect(iso(input)).toBe("2026-10-24T12:00:00.000Z");
  });

  it("returns an equal but distinct Date for a zero amount", () => {
    const result = time.subDays(start, 0);
    expect(result).not.toBe(start);
    expect(result.getTime()).toBe(start.getTime());
  });

  it("shifts the other way for a negative amount", () => {
    expect(time.subMinutes(start, -15).getTime()).toBe(time.addMinutes(start, 15).getTime());
    expect(time.addHours(start, -2).getTime()).toBe(time.subHours(start, 2).getTime());
  });

  it("accepts fractional amounts", () => {
    expect(iso(time.addMinutes(start, 1.5))).toBe("2026-10-24T12:01:30.000Z");
    expect(iso(time.subHours(start, 0.25))).toBe("2026-10-24T11:45:00.000Z");
  });

  it("truncates to whole milliseconds", () => {
    expect(time.addSeconds(start, 0.0015).getTime() - start.getTime()).toBe(1);
  });

  it("crosses month, year and leap-day boundaries on the UTC calendar", () => {
    expect(iso(time.addDays(at("2028-02-28T08:00:00.000Z"), 1))).toBe("2028-02-29T08:00:00.000Z");
    expect(iso(time.addDays(at("2027-02-28T08:00:00.000Z"), 1))).toBe("2027-03-01T08:00:00.000Z");
    expect(iso(time.addMinutes(at("2026-12-31T23:59:00.000Z"), 2))).toBe(
      "2027-01-01T00:01:00.000Z",
    );
    expect(iso(time.subSeconds(at("2027-01-01T00:00:00.000Z"), 1))).toBe(
      "2026-12-31T23:59:59.000Z",
    );
  });

  it("keeps a day at exactly 24 hours across a daylight-saving change", () => {
    // 2026-03-08 is the US spring-forward day and 2026-10-25 the EU fall-back day; UTC has neither.
    const springForward = at("2026-03-07T12:00:00.000Z");
    const fallBack = at("2026-10-24T23:30:00.000Z");
    expect(time.addDays(springForward, 1).getTime() - springForward.getTime()).toBe(86_400_000);
    expect(iso(time.addDays(springForward, 1))).toBe("2026-03-08T12:00:00.000Z");
    expect(iso(time.addHours(fallBack, 3))).toBe("2026-10-25T02:30:00.000Z");
    expect(iso(time.subDays(at("2026-10-26T00:00:00.000Z"), 2))).toBe("2026-10-24T00:00:00.000Z");
  });

  it("does not read the host time zone", () => {
    const local = new Date(2026, 9, 24, 12, 0, 0);
    expect(time.addHours(local, 24).getTime() - local.getTime()).toBe(86_400_000);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "throws a RangeError for the amount %d",
    (amount) => {
      expect(() => time.addMinutes(start, amount)).toThrow(RangeError);
      expect(() => time.subMinutes(start, amount)).toThrow(RangeError);
    },
  );

  it("throws a RangeError for an invalid date", () => {
    expect(() => time.subMinutes(new Date("not a date"), 5)).toThrow(RangeError);
    expect(() => time.addDays(new Date(Number.NaN), 1)).toThrow("time: the date is invalid");
  });

  it("is frozen, so a consumer cannot replace a helper", () => {
    expect(Object.isFrozen(time)).toBe(true);
  });

  it.each([
    ["2026-01-31T09:30:00.000Z", 1, "2026-02-28T09:30:00.000Z"],
    ["2028-01-31T09:30:00.000Z", 1, "2028-02-29T09:30:00.000Z"],
    ["2026-01-15T00:00:00.000Z", 1, "2026-02-15T00:00:00.000Z"],
    ["2026-11-30T00:00:00.000Z", 3, "2027-02-28T00:00:00.000Z"],
    ["2026-03-31T00:00:00.000Z", -1, "2026-02-28T00:00:00.000Z"],
    ["2026-01-31T00:00:00.000Z", -2, "2025-11-30T00:00:00.000Z"],
    ["2028-02-29T00:00:00.000Z", 12, "2029-02-28T00:00:00.000Z"],
    ["2026-05-31T00:00:00.000Z", 0, "2026-05-31T00:00:00.000Z"],
  ] as const)("addMonths(%s, %d) clamps to %s", (from, amount, expected) => {
    expect(iso(time.addMonths(at(from), amount))).toBe(expected);
    expect(iso(time.subMonths(at(from), -amount))).toBe(expected);
  });

  it("shifts months from a fixed anchor without drift and leaves the input alone", () => {
    const anchor = at("2026-01-31T00:00:00.000Z");
    const periods = [1, 2, 3].map((n) => iso(time.addMonths(anchor, n)));
    expect(periods).toEqual([
      "2026-02-28T00:00:00.000Z",
      "2026-03-31T00:00:00.000Z",
      "2026-04-30T00:00:00.000Z",
    ]);
    expect(iso(anchor)).toBe("2026-01-31T00:00:00.000Z");
  });

  it("refuses a fractional or infinite month amount and an invalid date", () => {
    expect(() => time.addMonths(start, 1.5)).toThrow(RangeError);
    expect(() => time.subMonths(start, Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => time.addMonths(new Date(Number.NaN), 1)).toThrow("time: the date is invalid");
  });

  it("offers exactly the add and sub pairs for seconds, minutes, hours, days and months", () => {
    expect(Object.keys(time).sort()).toEqual(
      [
        "addDays",
        "addHours",
        "addMinutes",
        "addMonths",
        "addSeconds",
        "subDays",
        "subMonths",
        "subHours",
        "subMinutes",
        "subSeconds",
      ].sort(),
    );
  });
});
