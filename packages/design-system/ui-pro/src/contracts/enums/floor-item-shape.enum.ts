/**
 * Stackra file contract:
 * Purpose: the shapes a floor-plan item takes: a rectangular or round table, a wall, or a free-standing label (a
 *          door, the bar, "Terrace").
 * Boundary: the values only. Which shapes a venue offers is the caller's; the editor draws each one.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */

/** The floor-plan item shapes. */
// shortcut: a frozen tuple, as the @stackra/ui contracts' enums are, until Enum.of reaches the contracts (ADR 0128).
export const FloorItemShape = Object.freeze(["rectangle", "round", "wall", "label"] as const);

/** One floor-plan item shape. */
export type FloorItemShape = (typeof FloorItemShape)[number];
