/**
 * Stackra file contract:
 * Purpose: the levels of the material, thinnest first, then the two Liquid Glass variants. The standard levels
 *          (`ultra-thin` for glyphs over art, `thin` for small chrome, `regular` for bars and cards whose text is all
 *          `foreground`, `thick` for surfaces that hold muted or long text) separate regions inside content; `glass`
 *          is the functional layer (bars, sheets, popovers, menus, toasts) and `glass-clear` a control over media,
 *          always over its dim.
 * Boundary: the names only; each level's values live in a Theme (`materials.levels`), its rendering in core.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (the glass material); ADR 0501 (tokens v2, the materials block).
 */

/** The material levels: the standard thicknesses, thinnest first, then the glass variants. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the levels carry no labels.
export const MaterialLevel = Object.freeze([
  "ultra-thin",
  "thin",
  "regular",
  "thick",
  "glass",
  "glass-clear",
] as const);

/** One material level. */
export type MaterialLevel = (typeof MaterialLevel)[number];
