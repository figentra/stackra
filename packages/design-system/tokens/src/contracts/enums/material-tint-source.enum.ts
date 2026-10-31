/**
 * Stackra file contract:
 * Purpose: the colour a material level's fill is mixed from: the `surface` role, the `accent` role, the `overlay`
 *          role, or `none` (clear glass, which draws only its black dim).
 * Boundary: the names only.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (the glass material); ADR 0501 (tokens v2, the materials block).
 */

/** The colour a level's fill is mixed from. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128).
export const MaterialTintSource = Object.freeze(["surface", "accent", "overlay", "none"] as const);

/** One tint source. */
export type MaterialTintSource = (typeof MaterialTintSource)[number];
