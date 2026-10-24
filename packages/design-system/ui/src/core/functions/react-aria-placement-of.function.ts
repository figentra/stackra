/**
 * Stackra file contract:
 * Purpose: the placement string React Aria takes (`bottom start`, `end top`) for a side and an alignment, so the web
 *          Popover, Tooltip and Menu place themselves with one rule.
 * Boundary: pure; internal, not in the `.` barrel (the web components import it by path). React Aria reads `start` and
 *           `end` against the document direction, so no direction is needed.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0060 (right-to-left).
 */
import type { PlacementAlign } from "#contracts/enums/placement-align.enum";
import type { Placement } from "#contracts/enums/placement.enum";

/** The placements React Aria accepts that this function can produce; it has no `top top` or `end end`. */
type ReactAriaPlacement =
  | Placement
  | "top start"
  | "top end"
  | "bottom start"
  | "bottom end"
  | "start top"
  | "start bottom"
  | "end top"
  | "end bottom";

/** The cross-axis word React Aria uses when the side is `start` or `end`: the edge runs top to bottom. */
const VERTICAL_ALIGN = Object.freeze({ start: "top", end: "bottom" } as const);

/**
 * The React Aria placement of a side and an alignment.
 * @param placement - the side of the trigger
 * @param align - where along that side's edge; `center` is React Aria's default and adds no word
 * @returns the placement, for example `bottom end` or `start top`
 */
export function reactAriaPlacementOf(
  placement: Placement,
  align: PlacementAlign = "center",
): ReactAriaPlacement {
  if (align === "center") {
    return placement;
  }
  const isVertical = placement === "start" || placement === "end";
  // The cast holds because `isVertical` pairs a start or end side with top or bottom, and the rest with start or end.
  return `${placement} ${isVertical ? VERTICAL_ALIGN[align] : align}` as ReactAriaPlacement;
}
