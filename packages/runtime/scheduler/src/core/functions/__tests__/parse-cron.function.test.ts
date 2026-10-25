/**
 * Stackra file contract:
 * Purpose: unit tests of `parseCron`: values, ranges, steps and lists in each field; month and weekday names; Sunday as
 *          7; the day-field `*` flags; and a refusal naming the field for every malformed expression.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0148 (decision 4).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { InvalidCronError } from "#core/errors/invalid-cron.error";
import { parseCron } from "#core/functions/parse-cron.function";

/** The sorted values of a field. */
const sorted = (values: ReadonlySet<number>): number[] => [...values].sort((a, b) => a - b);

/** The refusal `parseCron(expression)` throws. */
function refusalOf(expression: string): InvalidCronError {
  try {
    parseCron(expression);
  } catch (error) {
    if (isRefusal(error, InvalidCronError)) return error;
    throw error;
  }
  throw new Error(`${expression} parsed`);
}

describe(parseCron, () => {
  it("reads every-five-minutes, as the template's order expiry runs", () => {
    const fields = parseCron("*/5 * * * *");
    expect(sorted(fields.minutes)).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    expect(fields.hours.size).toBe(24);
    expect(fields.days.size).toBe(31);
    expect(fields.months.size).toBe(12);
    expect(sorted(fields.weekdays)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(fields.anyDay).toBe(true);
    expect(fields.anyWeekday).toBe(true);
  });

  it("reads values, ranges, stepped ranges, a start with a step, and lists", () => {
    const fields = parseCron("30 3 1-10/3 2,6-7 5/1");
    expect(sorted(fields.minutes)).toEqual([30]);
    expect(sorted(fields.hours)).toEqual([3]);
    expect(sorted(fields.days)).toEqual([1, 4, 7, 10]);
    expect(sorted(fields.months)).toEqual([2, 6, 7]);
    expect(sorted(fields.weekdays)).toEqual([0, 5, 6]);
    expect(fields.anyDay).toBe(false);
    expect(fields.anyWeekday).toBe(false);
  });

  it("reads month and weekday names in any case, and Sunday as 7", () => {
    const fields = parseCron("0 9 * JAN,dec Mon-Fri");
    expect(sorted(fields.months)).toEqual([1, 12]);
    expect(sorted(fields.weekdays)).toEqual([1, 2, 3, 4, 5]);
    expect(sorted(parseCron("0 0 * * 7").weekdays)).toEqual([0]);
  });

  it("trims and splits on any whitespace", () => {
    expect(sorted(parseCron("  15\t4  *  *  * ").minutes)).toEqual([15]);
  });

  it("marks a stepped star as an unrestricted day field", () => {
    expect(parseCron("0 0 */2 * 1").anyDay).toBe(true);
  });

  it.each([
    ["", "expression"],
    ["* * * *", "expression"],
    ["* * * * * *", "expression"],
    ["60 * * * *", "minute"],
    ["*/0 * * * *", "minute"],
    ["1/2/3 * * * *", "minute"],
    ["a * * * *", "minute"],
    ["* 24 * * *", "hour"],
    ["* 5-1 * * *", "hour"],
    ["* * 0 * *", "day"],
    ["* * 1-2-3 * *", "day"],
    ["* * * 13 *", "month"],
    ["* * * foo *", "month"],
    ["* * * * 8", "weekday"],
    ["* * * * L", "weekday"],
    ["@daily", "expression"],
  ])("refuses %j at %s", (expression, field) => {
    const refusal = refusalOf(expression);
    expect(refusal.code).toBe("invalid_cron");
    expect(refusal.details).toEqual({ expression, field });
  });
});
