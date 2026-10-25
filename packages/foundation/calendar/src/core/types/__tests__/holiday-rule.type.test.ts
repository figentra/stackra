/**
 * Stackra file contract:
 * Purpose: type tests of `HolidayRule`: one entry of `BusinessCalendar.holidays`, with three kinds and required days.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { BusinessCalendar } from "#core/types/business-calendar.type";
import type { HolidayRule } from "#core/types/holiday-rule.type";

describe("HolidayRule", () => {
  it("is one holiday entry", () => {
    expectTypeOf<HolidayRule>().toEqualTypeOf<BusinessCalendar["holidays"][number]>();
    expectTypeOf<Extract<HolidayRule, { kind: "hijri" }>["sighted"]>().toEqualTypeOf<boolean>();
  });
});
