/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Aggregate`: the five totals of a saved view, codes in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0359 (decision 14).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Aggregate } from "#core/enums/aggregate.enum";

describe("Aggregate", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(Aggregate)).toEqual(["count", "sum", "average", "min", "max"]);
  });

  it("types its values", () => {
    expectTypeOf<Aggregate>().toEqualTypeOf<"count" | "sum" | "average" | "min" | "max">();
  });
});
