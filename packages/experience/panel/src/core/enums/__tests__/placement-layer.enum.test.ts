/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PlacementLayer`: an `Enum.of` enum whose codes are in source order, with its case
 *          data and a same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PlacementLayer } from "#core/enums/placement-layer.enum";

describe("PlacementLayer", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(PlacementLayer)).toEqual(["1", "2", "2b", "3", "4", "5"]);
  });

  it("carries its case data", () => {
    expect(Enum.meta(PlacementLayer, PlacementLayer.Host).rank).toBeLessThan(
      Enum.meta(PlacementLayer, PlacementLayer.Edition).rank,
    );
    expect(Enum.meta(PlacementLayer, PlacementLayer.Edition).rank).toBeLessThan(
      Enum.meta(PlacementLayer, PlacementLayer.App).rank,
    );
  });

  it("types its values", () => {
    expectTypeOf<PlacementLayer>().toEqualTypeOf<"1" | "2" | "2b" | "3" | "4" | "5">();
  });
});
