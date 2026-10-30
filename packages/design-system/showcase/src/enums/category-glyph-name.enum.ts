/**
 * Stackra file contract:
 * Purpose: `CategoryGlyphName`, the brand-kit glyph a category wears (the names of the playground's `BRAND_GLYPHS`).
 * Boundary: the values only; the apps draw the glyph.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2; ADR 0305 (one declaration per file).
 */

/** The brand glyph names a category may wear. */
export const CategoryGlyphName = Object.freeze([
  "token",
  "pipeline",
  "docs",
  "link",
  "module",
  "alert",
  "terminal",
  "check",
  "schema",
  "graph",
  "provider",
  "menu",
  "package",
  "settings",
] as const);

/** One category glyph name. */
export type CategoryGlyphName = (typeof CategoryGlyphName)[number];
