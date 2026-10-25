/**
 * Stackra file contract:
 * Purpose: unit tests of `openRanges`: merged millisecond ranges of working hours, with touching spans joined.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expect, it } from "@stackra/testing";

import { openRanges } from "#core/functions/open-ranges.function";
import type { BusinessCalendar } from "#core/types/business-calendar.type";

const calendar: BusinessCalendar = {
  timeZone: "UTC",
  workingWeek: [
    {
      day: 7,
      hours: [
        { start: "09:00", end: "12:00" },
        { start: "12:00", end: "13:00" },
      ],
    },
  ],
  holidays: [],
  uncertainDays: "working",
};

describe("openRanges", () => {
  it("merges touching spans", () => {
    expect(
      openRanges(calendar, Date.parse("2026-01-04T00:00:00Z"), Date.parse("2026-01-05T00:00:00Z")),
    ).toEqual([[Date.parse("2026-01-04T09:00:00Z"), Date.parse("2026-01-04T13:00:00Z")]]);
  });
});
