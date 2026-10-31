/**
 * Stackra file contract:
 * Purpose: `FULLSCREEN_BAR_LONG_PRESS_MS`, how long the manager gesture's press at the top edge lasts before a locked
 *          `FullscreenBar` comes back.
 * Boundary: a number only; internal, imported by path from `react/` and `native/`.
 * Runtime: isomorphic
 * Governing contract: GAPS.md row 32 (owner decision 2026-10-28).
 */

/** Long enough that a customer's tap or swipe never reveals the bar; in milliseconds. */
// oxlint-disable-next-line stackra/no-literal-duration -- a long-press hold threshold, not motion
export const FULLSCREEN_BAR_LONG_PRESS_MS = 800;
