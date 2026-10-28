/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ViewLayout`: table, board, gallery, calendar and chart, codes in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0271 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ViewLayout } from "#core/enums/view-layout.enum";

describe("ViewLayout", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(ViewLayout)).toEqual(["table", "board", "gallery", "calendar", "chart"]);
  });

  it("types its values", () => {
    expectTypeOf<ViewLayout>().toEqualTypeOf<
      "table" | "board" | "gallery" | "calendar" | "chart"
    >();
  });
});
