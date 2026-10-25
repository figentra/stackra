/**
 * Stackra file contract:
 * Purpose: unit tests of `resolvePlacements`: per item, only the highest layer's placements stay (2b between host and app),
 *          the input order is kept, and items of one layer only are untouched.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0306 (rules 7 and 8); ADR 0336 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { PlacementLayer } from "#core/enums/placement-layer.enum";
import { resolvePlacements } from "#core/functions/resolve-placements.function";

describe("resolvePlacements", () => {
  it("keeps each item's highest layer and never merges", () => {
    const placements = [
      { key: "a", layer: PlacementLayer.Owner, order: 1 },
      { key: "b", layer: PlacementLayer.Owner, order: 2 },
      { key: "a", layer: PlacementLayer.Host, order: 3 },
      { key: "a", layer: PlacementLayer.Edition, order: 4 },
      { key: "a", layer: PlacementLayer.Edition, order: 5 },
    ];
    expect(resolvePlacements(placements).map((placement) => placement.order)).toEqual([2, 4, 5]);
    const withApp = [...placements, { key: "a", layer: PlacementLayer.App, order: 6 }];
    expect(resolvePlacements(withApp).map((placement) => placement.order)).toEqual([2, 6]);
  });
});
