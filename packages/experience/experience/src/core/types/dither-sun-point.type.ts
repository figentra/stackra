/**
 * Stackra file contract:
 * Purpose: `DitherSunPoint`, where a dither band's core glow (the sun) sits, as fractions of the band's width and
 *          height (`@stackra/ui`'s `DitherSun`).
 * Boundary: a type only, the field type of the landing blocks. A fraction may run past either edge.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */

/** The centre of the core glow. */
export interface DitherSunPoint {
  /** 0 at the inline start (the right edge in right-to-left), 1 at the inline end. */
  readonly x: number;

  /** 0 at the top, 1 at the bottom. */
  readonly y: number;
}
