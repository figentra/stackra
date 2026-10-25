/**
 * Stackra file contract:
 * Purpose: the thicknesses of the glass material, thinnest first: `thin` for small chrome (tiles, chips over art),
 *          `regular` for bars and panels, `thick` for large surfaces that hold reading text (sheets, palettes).
 *          A thicker level shows more of its surface and blurs the backdrop further.
 * Boundary: the names only; each level's values live in a Theme (`materials.levels`), its rendering in core.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (the glass material); ADR 0302 (Stackra Design System).
 */

/** The material levels, thinnest first. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the levels carry no labels.
export const MaterialLevel = Object.freeze(["thin", "regular", "thick"] as const);

/** One material level. */
export type MaterialLevel = (typeof MaterialLevel)[number];
