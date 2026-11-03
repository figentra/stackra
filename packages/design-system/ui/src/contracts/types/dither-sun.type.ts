/**
 * Stackra file contract:
 * Purpose: `DitherSun`, where a `DitherArt` pattern's core glow (the sun, the champagne engine) sits, as fractions of
 *          the art's width and height: x 0 at the left edge, y 0 at the top.
 * Boundary: types only. Physical, not logical: art never mirrors in right-to-left (brand rules §40).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); brand rules §40; STA-2041.
 */

/** The centre of a dither pattern's core glow. */
export interface DitherSun {
  /** 0 at the left edge, 1 at the right; may run past either edge. */
  readonly x: number;
  /** 0 at the top, 1 at the bottom; may run past either edge. */
  readonly y: number;
}
