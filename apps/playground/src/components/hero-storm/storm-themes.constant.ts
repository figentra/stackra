/**
 * Stackra file contract:
 * Purpose: `STORM_THEMES`, the themes the theme-storm hero turns through, in order: real brand layers of
 *          `BRAND_THEMES` (Stackra first), three in the page's scheme and two always dark, so the turn shows colour,
 *          radius, type and mode changing.
 * Boundary: data only; the layers and their names are `BRAND_THEMES`' own.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (hero concept B); ADR 0340 (decision 2, brand layers).
 */

/** A brand layer, and the scheme it is drawn in (none: the page's). */
export const STORM_THEMES: readonly { readonly brand: string; readonly scheme?: "dark" }[] = [
  { brand: "stackra" },
  { brand: "figentra" },
  { brand: "juristra", scheme: "dark" },
  { brand: "tamo" },
  { brand: "organza", scheme: "dark" },
];
