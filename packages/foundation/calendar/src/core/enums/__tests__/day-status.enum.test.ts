/**
 * Stackra file contract:
 * Purpose: unit and type tests of `DayStatus`: an `Enum.of` value with its snake_case codes in order and a same-named type.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0366.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DayStatus } from "#core/enums/day-status.enum";

describe("DayStatus", () => {
  it("lists its codes", () => {
    expect(Enum.values(DayStatus)).toEqual(["working", "rest_day", "holiday", "uncertain"]);
  });

  it("types one code", () => {
    expectTypeOf<DayStatus>().toEqualTypeOf<"working" | "rest_day" | "holiday" | "uncertain">();
  });
});
