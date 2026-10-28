/**
 * Stackra file contract:
 * Purpose: unit and type tests of `QuotaPeriod`: day, month and year, in order, with snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0216; stackra-309.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { QuotaPeriod } from "#core/enums/quota-period.enum";

describe("QuotaPeriod", () => {
  it("has a day, a month and a year", () => {
    expect(Enum.values(QuotaPeriod)).toEqual(["day", "month", "year"]);
  });

  it("types a period as its codes", () => {
    expectTypeOf<QuotaPeriod>().toEqualTypeOf<"day" | "month" | "year">();
  });
});
