/**
 * Stackra file contract:
 * Purpose: unit tests of `periodInstances`: matching days times each time of day (the series' own time filling an
 *          absent part), sorted and de-duplicated, then BYSETPOS from either end, a position beyond the set picking
 *          nothing.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0387.
 */
import { describe, expect, it } from "@stackra/testing";

import { dayNumber } from "#core/functions/day-number.function";
import { parseRrule } from "#core/functions/parse-rrule.function";
import { periodInstances } from "#core/functions/period-instances.function";

const start = dayNumber("2026-01-05"); // a Monday
const ten = 36_000; // 10:00:00

describe("periodInstances", () => {
  it("keeps the series' time when no time part is given", () => {
    expect(
      periodInstances(parseRrule("FREQ=WEEKLY;BYDAY=MO,WE"), start, ten, [start, start + 6]),
    ).toEqual([
      [start, ten],
      [start + 2, ten],
    ]);
  });

  it("crosses hours with the series' minute and second, sorted once each", () => {
    expect(
      periodInstances(parseRrule("FREQ=DAILY;BYHOUR=17,9,9"), start, ten + 90, [start, start]),
    ).toEqual([
      [start, 9 * 3600 + 90],
      [start, 17 * 3600 + 90],
    ]);
    expect(
      periodInstances(parseRrule("FREQ=DAILY;BYMINUTE=0,30"), start, ten, [start, start]),
    ).toEqual([
      [start, ten],
      [start, ten + 1800],
    ]);
  });

  it("applies BYSETPOS from either end", () => {
    const rule = parseRrule("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=1,-1,9");
    expect(periodInstances(rule, start, ten, [start, start + 6])).toEqual([
      [start, ten],
      [start + 4, ten],
    ]);
  });
});
