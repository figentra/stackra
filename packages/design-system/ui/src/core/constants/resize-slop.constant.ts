/**
 * Stackra file contract:
 * Purpose: `RESIZE_SLOP`, how far the pointer moves on a resize strip before a press counts as a drag, in pixels.
 * Boundary: a constant; `useResizeHandle` and `Sidebar.Rail` read it.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); owner request 2026-10-29 (STA-1371).
 */

/** The drag threshold of a resize strip, in pixels. */
export const RESIZE_SLOP = 3;
