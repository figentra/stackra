/**
 * Stackra file contract:
 * Purpose: the physical side (`left` or `right`, as HeroUI Native names it) of a logical overlay side in a text
 *          direction; `top` and `bottom` have no direction and pass through.
 * Boundary: pure; internal, not in the `.` barrel (the native Popover and Menu import it by path).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0060 (right-to-left).
 */
import type { Direction } from "#contracts/enums/direction.enum";
import type { Placement } from "#contracts/enums/placement.enum";

/**
 * The physical side of a logical one: `end` is right in left-to-right and left in right-to-left.
 * @param placement - the logical side, for example `end`
 * @param direction - the text direction the overlay is drawn in
 * @returns `top`, `bottom`, `left` or `right`
 */
export function physicalSideOf(
  placement: Placement,
  direction: Direction,
): "top" | "bottom" | "left" | "right" {
  if (placement === "top" || placement === "bottom") {
    return placement;
  }
  return (placement === "end") === (direction === "ltr") ? "right" : "left";
}
