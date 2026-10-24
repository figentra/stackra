/**
 * Stackra file contract:
 * Purpose: the degrees of the glass material a document can run in, set once on `<html data-material="…">`:
 *          `solid` (opaque surfaces, the product default and the reduced-transparency fallback), `frosted` (a dense
 *          fill and a heavy blur), `glass` (the showcase default) and `liquid` (a lighter fill, a lifted backdrop and
 *          a sheen along the top edge). Every level scales by the mode, so one switch moves the whole page.
 * Boundary: the names only; each mode's factors live in core (`MATERIAL_MODES`), its CSS in `renderWebCss`.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (the glass material); ADR 0302 (Stackra Design System).
 */

/** The material modes, from opaque to the most translucent. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the modes carry no labels.
export const MaterialMode = Object.freeze(["solid", "frosted", "glass", "liquid"] as const);

/** One material mode. */
export type MaterialMode = (typeof MaterialMode)[number];
