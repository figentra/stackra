/**
 * Stackra file contract:
 * Purpose: the brand icon a showcase category wears, on the group cards, the components index and the command
 *          palette's rows: the glyph `CATEGORIES` names for it, the module glyph for a category not registered.
 * Boundary: decoration only (`aria-hidden`); the category's name is always written beside it.
 * Runtime: browser
 * Governing contract: ADR 0320 (the showcase stage); showcase redesign spec section 2 (`CategoryEntry.glyph`).
 */
import { CATEGORIES } from "@stackra/showcase";

import { BrandGlyph } from "#src/components/brand-glyph";
import type { CategoryGlyphProps } from "#src/components/category-glyph/category-glyph.props";

/** The brand icon of `category`. */
export function CategoryGlyph({ category, className }: CategoryGlyphProps) {
  return (
    <BrandGlyph
      name={CATEGORIES.find((entry) => entry.id === category)?.glyph ?? "module"}
      {...(className ? { className } : {})}
    />
  );
}
