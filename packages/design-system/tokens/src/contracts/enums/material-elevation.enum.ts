/**
 * Stackra file contract:
 * Purpose: the four elevations, no more (each depth change costs the eye a refocus): `none` (flat), `raised` (a
 *          thumb, a card on the page), `floating` (glass chrome, the action bar, toasts) and `overlay` (popovers,
 *          menus, sheets).
 * Boundary: the names only; `raised` and `overlay` read the theme's shadows, `floating` its `floating` shadow.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (the glass material); ADR 0501 (tokens v2, the materials block).
 */

/** The elevations a material level may cast. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128).
export const MaterialElevation = Object.freeze(["none", "raised", "floating", "overlay"] as const);

/** One elevation a level may cast. */
export type MaterialElevation = (typeof MaterialElevation)[number];
