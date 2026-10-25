/**
 * Stackra file contract:
 * Purpose: unit tests of `isOpen`: working days are open, closed statuses are not, uncertain days follow the calendar.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { DayStatus } from "#core/enums/day-status.enum";
import { isOpen } from "#core/functions/is-open.function";
import type { BusinessCalendar } from "#core/types/business-calendar.type";

const calendar: BusinessCalendar = {
  timeZone: "UTC",
  workingWeek: [],
  holidays: [],
  uncertainDays: "working",
};

describe("isOpen", () => {
  it("reads the status", () => {
    expect(isOpen(calendar, DayStatus.Working)).toBe(true);
    expect(isOpen(calendar, DayStatus.Holiday)).toBe(false);
    expect(isOpen(calendar, DayStatus.RestDay)).toBe(false);
    expect(isOpen(calendar, DayStatus.Uncertain)).toBe(true);
    expect(isOpen({ ...calendar, uncertainDays: "closed" }, DayStatus.Uncertain)).toBe(false);
  });
});
