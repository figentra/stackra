/**
 * Stackra file contract:
 * Purpose: `StudioFonts`: the display stacks the canvas draws headings in, as the page resolved them.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */

/** The display stacks, CSS `font-family` lists. */
export interface StudioFonts {
  /** The Latin display stack, `--font-display`. */
  readonly display: string;
  /** The Arabic display stack, `--font-display-arabic`. */
  readonly displayArabic: string;
}
