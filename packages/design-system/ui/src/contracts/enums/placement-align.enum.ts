/**
 * Stackra file contract:
 * Purpose: where along its trigger's edge an anchored overlay lines up: with the reading start of the edge, its
 *          centre or its reading end. On a top or bottom side that is the horizontal edge; on a start or end side it is
 *          the vertical one, where start is the top.
 * Boundary: the values only; paired with `Placement` by `reactAriaPlacementOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0060 (right-to-left).
 */

/** The overlay alignments along the trigger's edge. HeroUI Native's `align` takes the same three words. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the alignments carry no labels.
export const PlacementAlign = Object.freeze(["start", "center", "end"] as const);

/** One overlay alignment. */
export type PlacementAlign = (typeof PlacementAlign)[number];
