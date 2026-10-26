/**
 * Stackra file contract:
 * Purpose: type tests of `PackCalendarOptions`: every field optional; holidays are holiday rules.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0387.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { HolidayRule } from "#core/types/holiday-rule.type";
import type { PackCalendarOptions } from "#core/types/pack-calendar-options.type";

describe("PackCalendarOptions", () => {
  it("has only optional fields", () => {
    expectTypeOf<Record<string, never>>().toExtend<PackCalendarOptions>();
    expectTypeOf<PackCalendarOptions["holidays"]>().toEqualTypeOf<
      readonly HolidayRule[] | undefined
    >();
  });
});
