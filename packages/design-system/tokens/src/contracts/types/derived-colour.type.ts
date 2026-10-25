/**
 * Stackra file contract:
 * Purpose: how a component library derives a colour from the theme's, as `color-mix(in oklab, <from> <share>%,
 *          <with> <withShare>%)`: HeroUI v3 paints its hover, soft and soft-foreground colours this way, so a check of
 *          what is painted must mix them the same way.
 * Boundary: types only; `paintedColour` evaluates one.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 4: check what is painted).
 */

/** One `color-mix(in oklab, …)` of painted names. */
export interface DerivedColour {
  /** The first colour's painted name. */
  readonly from: string;
  /** Its percentage, 0 to 100. */
  readonly share: number;
  /** The second colour's painted name, or `transparent`. */
  readonly with: string;
  /** Its percentage; left out, 100 minus `share`. The two are normalised as CSS does when they do not sum to 100. */
  readonly withShare?: number;
}
