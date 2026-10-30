/**
 * Stackra file contract:
 * Purpose: `categoryGlyph`, the brand glyph a category wears on the cards: the registry's choice when the app draws it,
 *          else the module glyph.
 * Boundary: a pure function over `CATEGORIES` and the app's glyph set.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 5.
 */
import { CATEGORIES, type ComponentCategory } from "@stackra/showcase";

import type { BrandGlyphName } from "./brand-glyph-name.type";
import { BRAND_GLYPHS } from "./brand-glyphs.constant";

/** The glyph name of `category`, one the app draws. */
export function categoryGlyph(category: ComponentCategory): BrandGlyphName {
  const glyph = CATEGORIES.find((entry) => entry.id === category)?.glyph;
  return glyph !== undefined && Object.hasOwn(BRAND_GLYPHS, glyph)
    ? (glyph as BrandGlyphName)
    : "module";
}
