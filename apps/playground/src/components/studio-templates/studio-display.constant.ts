/**
 * Stackra file contract:
 * Purpose: `STUDIO_DISPLAY`: the classes that set a canvas heading in the theme's display face: `--font-display`, or
 *          `--font-display-arabic` in a right-to-left page, both set on the canvas by the studio preview.
 * Boundary: data only, in its own file. Important, so it wins over a heading's own `font` shorthand.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0340 (decision 2: display faces).
 */

/** The display-face classes of a canvas heading. */
export const STUDIO_DISPLAY =
  "[font-family:var(--font-display)]! rtl:[font-family:var(--font-display-arabic)]!";
