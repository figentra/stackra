/**
 * Stackra file contract:
 * Purpose: unit and type tests of `HolidayKind`: an `Enum.of` value with its snake_case codes in order and a same-named type.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366; ADR 0387.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { HolidayKind } from "#core/enums/holiday-kind.enum";

describe("HolidayKind", () => {
  it("lists its codes", () => {
    expect(Enum.values(HolidayKind)).toEqual(["dated", "gregorian", "nth_weekday", "hijri"]);
  });

  it("types one code", () => {
    expectTypeOf<HolidayKind>().toEqualTypeOf<"dated" | "gregorian" | "nth_weekday" | "hijri">();
  });
});
