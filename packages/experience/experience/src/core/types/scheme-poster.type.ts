/**
 * Stackra file contract:
 * Purpose: `SchemePoster`, a dither band's poster per colour scheme: what the edge render, a page without script and
 *          print show under the canvas until it draws.
 * Boundary: a type only, the field type of the landing blocks. Each value is a root-relative URL
 *           (`/posters/strata-dark.png`).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */

/** One poster per scheme. */
export interface SchemePoster {
  /** The poster's URL for the light scheme. */
  readonly light: string;

  /** The poster's URL for the dark scheme. */
  readonly dark: string;
}
