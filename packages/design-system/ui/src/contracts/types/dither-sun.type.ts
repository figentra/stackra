/**
 * Stackra file contract:
 * Purpose: `DitherSun`, where a `DitherArt` pattern's core glow (the sun, the champagne engine) sits, as fractions of
 *          the art's width and height: x 0 at the inline start, y 0 at the top.
 * Boundary: types only. Logical, like the layout it lights: in right-to-left x 0 is the right edge, so the sun stays
 *           under a drawing the mirrored layout moved (a dot field mirrors as a whole; a glyph field moves the sun).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); brand rules §40; STA-2041.
 */

/** The centre of a dither pattern's core glow. */
export interface DitherSun {
  /** 0 at the inline start (left in left-to-right, right in right-to-left), 1 at the end; may run past either edge. */
  readonly x: number;
  /** 0 at the top, 1 at the bottom; may run past either edge. */
  readonly y: number;
}
