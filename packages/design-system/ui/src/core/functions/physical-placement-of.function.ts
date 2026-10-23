/**
 * Stackra file contract:
 * Purpose: the physical corner (HeroUI's `top-right` and so on) of a logical badge corner in a text direction.
 * Boundary: pure; internal, not in the `.` barrel (the web Badge imports it by path, native uses logical sides).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0060 (right-to-left).
 */
import type { BadgePlacement } from "#contracts/enums/badge-placement.enum";
import type { Direction } from "#contracts/enums/direction.enum";

/**
 * The physical corner of a logical one: `end` is right in left-to-right and left in right-to-left.
 * @param placement - the logical corner, for example `top-end`
 * @param direction - the text direction the badge is drawn in
 * @returns HeroUI's corner name, for example `top-right`
 */
export function physicalPlacementOf(
  placement: BadgePlacement,
  direction: Direction,
): `${"top" | "bottom"}-${"left" | "right"}` {
  const block = placement.startsWith("top") ? "top" : "bottom";
  return `${block}-${placement.endsWith("end") === (direction === "ltr") ? "right" : "left"}`;
}
