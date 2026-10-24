/**
 * Stackra file contract:
 * Purpose: proves each logical overlay side lands on the physical side of its reading direction: `end` is right in
 *          left-to-right and left in right-to-left, `start` the other way, and `top` and `bottom` never change.
 * Boundary: pure function, no DOM.
 * Runtime: node
 * Governing contract: ADR 0312; ADR 0060 (right-to-left); ADR 0022 (test placement).
 */
// @covers sta-350:FR-097 sta-350:P-054
import { Direction } from "#contracts/enums/direction.enum";
import { Placement } from "#contracts/enums/placement.enum";
import { physicalSideOf } from "#core/functions/physical-side-of.function";

/** The expected physical side of every logical side, by direction. */
const EXPECTED = {
  top: { ltr: "top", rtl: "top" },
  bottom: { ltr: "bottom", rtl: "bottom" },
  start: { ltr: "left", rtl: "right" },
  end: { ltr: "right", rtl: "left" },
} as const satisfies Record<Placement, Record<Direction, string>>;

describe("physicalSideOf", () => {
  it.each(Placement)("maps %s in both directions", (placement) => {
    for (const direction of Direction) {
      expect(physicalSideOf(placement, direction), `${placement} ${direction}`).toBe(
        EXPECTED[placement][direction],
      );
    }
  });
});
