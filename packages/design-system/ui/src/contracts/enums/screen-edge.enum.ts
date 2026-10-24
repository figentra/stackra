/**
 * Stackra file contract:
 * Purpose: the edges of a screen that `Screen` keeps clear of the system's own parts: `top` (the status bar, the
 *          notch, a desktop title bar), `bottom` (the home indicator) and `sides` (a notch in landscape). A screen
 *          inside a navigator leaves out the edge the navigator's header or tab bar already covers.
 * Boundary: the values only. `sides` names both horizontal edges together, because a safe-area inset is physical (the
 *           notch is on one real side) and the contract writes no `left` or `right` (ADR 0060).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0317 (decision 7); ADR 0060 (right-to-left).
 */

/** The screen edges that can be kept clear. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the edges carry no labels.
export const ScreenEdge = Object.freeze(["top", "bottom", "sides"] as const);

/** One screen edge. */
export type ScreenEdge = (typeof ScreenEdge)[number];
