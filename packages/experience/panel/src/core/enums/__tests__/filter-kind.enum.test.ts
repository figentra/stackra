/**
 * Stackra file contract:
 * Purpose: unit and type tests of `FilterKind`: an `Enum.of` enum whose codes are in source order, with a same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { FilterKind } from "#core/enums/filter-kind.enum";

describe("FilterKind", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(FilterKind)).toEqual([
      "text",
      "number",
      "date",
      "date-range",
      "boolean",
      "choice",
      "multi-choice",
      "principal",
      "time-range",
    ]);
    expect(FilterKind.MultiChoice).toBe("multi-choice");
  });

  it("types its values", () => {
    expectTypeOf<FilterKind>().toEqualTypeOf<
      | "text"
      | "number"
      | "date"
      | "date-range"
      | "boolean"
      | "choice"
      | "multi-choice"
      | "principal"
      | "time-range"
    >();
  });
});
