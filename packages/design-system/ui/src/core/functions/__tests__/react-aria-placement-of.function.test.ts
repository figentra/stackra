/**
 * Stackra file contract:
 * Purpose: proves a side and an alignment become the placement string React Aria reads: the side alone for `center`,
 *          the side and the alignment for the horizontal edges, and the side and `top` or `bottom` for the vertical
 *          edges of a `start` or `end` side. The typechecker proves every result is a placement React Aria accepts.
 * Boundary: pure function, no DOM.
 * Runtime: node
 * Governing contract: ADR 0312; ADR 0060 (right-to-left); ADR 0022 (test placement).
 */
// @covers sta-350:FR-097 sta-350:P-054
import type { PopoverProps } from "react-aria-components";
import { PlacementAlign } from "#contracts/enums/placement-align.enum";
import { Placement } from "#contracts/enums/placement.enum";
import { reactAriaPlacementOf } from "#core/functions/react-aria-placement-of.function";

describe("reactAriaPlacementOf", () => {
  it("is the side alone when centred, and centred by default", () => {
    for (const side of Placement) {
      expect(reactAriaPlacementOf(side, "center"), side).toBe(side);
      expect(reactAriaPlacementOf(side), side).toBe(side);
    }
  });

  it("adds the alignment on a top or bottom side", () => {
    expect(reactAriaPlacementOf("bottom", "start")).toBe("bottom start");
    expect(reactAriaPlacementOf("top", "end")).toBe("top end");
  });

  it("reads start as top and end as bottom on a start or end side", () => {
    expect(reactAriaPlacementOf("start", "start")).toBe("start top");
    expect(reactAriaPlacementOf("end", "end")).toBe("end bottom");
  });

  it("gives every side and alignment a placement React Aria accepts", () => {
    for (const side of Placement) {
      for (const align of PlacementAlign) {
        expectTypeOf(reactAriaPlacementOf(side, align)).toExtend<PopoverProps["placement"]>();
      }
    }
  });
});
