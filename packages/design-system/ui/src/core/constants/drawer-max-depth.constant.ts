/**
 * Stackra file contract:
 * Purpose: `DRAWER_MAX_DEPTH`, how many drawers the design stacks on one another (3).
 * Boundary: a deeper drawer still opens, with a development warning, so a route that asks for it never shows nothing;
 *           the recess of the layers under it stops at this depth.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (stacked overlays); owner request 2026-10-29 (STA-1371).
 */

/** The deepest stack of drawers the design allows. */
export const DRAWER_MAX_DEPTH = 3;
