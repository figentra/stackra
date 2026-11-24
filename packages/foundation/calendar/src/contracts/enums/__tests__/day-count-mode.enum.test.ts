/**
 * Stackra file contract:
 * Purpose: unit and type tests of `DayCountMode`: an `Enum.of` value with its snake_case codes in order (every day on the
 *          calendar, or only the days the business calendar is open) and a same-named type; the contracts entry exports
 *          the same value.
 * Boundary: test only; imports the subject through its `#contracts` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import { DayCountMode } from "#contracts/enums/day-count-mode.enum";

describe("DayCountMode", () => {
  it("lists its codes", () => {
    expect(Enum.values(DayCountMode)).toEqual(["calendar", "business"]);
  });

  it("names each code by its case", () => {
    expect(DayCountMode.Calendar).toBe("calendar");
    expect(DayCountMode.Business).toBe("business");
  });

  it("types one code", () => {
    expectTypeOf<DayCountMode>().toEqualTypeOf<"calendar" | "business">();
  });

  it("is the value the contracts entry exports", () => {
    expect(contracts.DayCountMode).toBe(DayCountMode);
  });
});
