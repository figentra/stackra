/**
 * Stackra file contract:
 * Purpose: unit and type tests of `TimeRange`: an `Enum.of` enum whose codes are in source order, with a same-named
 *          type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { TimeRange } from "#core/enums/time-range.enum";

describe("TimeRange", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(TimeRange)).toEqual([
      "today",
      "yesterday",
      "last_7_days",
      "last_30_days",
      "this_month",
      "custom",
    ]);
    expect(TimeRange.Today).toBe("today");
  });

  it("types its values", () => {
    expectTypeOf<TimeRange>().toEqualTypeOf<
      "today" | "yesterday" | "last_7_days" | "last_30_days" | "this_month" | "custom"
    >();
  });
});
