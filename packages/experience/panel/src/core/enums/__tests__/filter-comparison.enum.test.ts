/**
 * Stackra file contract:
 * Purpose: unit and type tests of `FilterComparison`: an `Enum.of` enum whose codes are in source order, with a
 *          same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { FilterComparison } from "#core/enums/filter-comparison.enum";

describe("FilterComparison", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(FilterComparison)).toEqual(["gt", "gte", "lt", "lte", "ne"]);
    expect(FilterComparison.Gte).toBe("gte");
  });

  it("types its values", () => {
    expectTypeOf<FilterComparison>().toEqualTypeOf<"gt" | "gte" | "lt" | "lte" | "ne">();
  });
});
