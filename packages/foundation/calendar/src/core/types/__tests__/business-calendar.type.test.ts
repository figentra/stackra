/**
 * Stackra file contract:
 * Purpose: type tests of `BusinessCalendar`: the output of the schema.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { describe, expectTypeOf, it } from "@stackra/testing";
import type { z } from "zod";

import type { BUSINESS_CALENDAR_SCHEMA } from "#core/constants/business-calendar-schema.constant";
import type { BusinessCalendar } from "#core/types/business-calendar.type";

describe("BusinessCalendar", () => {
  it("is the schema output", () => {
    expectTypeOf<BusinessCalendar>().toEqualTypeOf<z.output<typeof BUSINESS_CALENDAR_SCHEMA>>();
    expectTypeOf<BusinessCalendar["uncertainDays"]>().toEqualTypeOf<"working" | "closed">();
  });
});
