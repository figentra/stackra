/**
 * Stackra file contract:
 * Purpose: proves each logical badge corner lands on the physical corner of its reading direction: `end` is right in
 *          left-to-right and left in right-to-left, `start` the other way, and the block side never changes.
 * Boundary: pure function, no DOM.
 * Runtime: node
 * Governing contract: ADR 0060 (right-to-left); ADR 0304; ADR 0022 (test placement).
 */
// @covers sta-350:P-026
import { BadgePlacement } from "#contracts/enums/badge-placement.enum";
import { Direction } from "#contracts/enums/direction.enum";
import { physicalPlacementOf } from "#core/functions/physical-placement-of.function";

/** The expected physical corner of every logical corner, by direction. */
const EXPECTED = {
  "top-end": { ltr: "top-right", rtl: "top-left" },
  "top-start": { ltr: "top-left", rtl: "top-right" },
  "bottom-end": { ltr: "bottom-right", rtl: "bottom-left" },
  "bottom-start": { ltr: "bottom-left", rtl: "bottom-right" },
} as const satisfies Record<BadgePlacement, Record<Direction, string>>;

describe("physicalPlacementOf", () => {
  it.each(BadgePlacement)("maps %s in both directions", (placement) => {
    for (const direction of Direction) {
      expect(physicalPlacementOf(placement, direction), `${placement} ${direction}`).toBe(
        EXPECTED[placement][direction],
      );
    }
  });
});
