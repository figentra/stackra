/**
 * Stackra file contract:
 * Purpose: `CategoryEntry`, one row of `CATEGORIES`: the category id, its brand glyph and its place in the order.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0305 (one declaration per file).
 */
import type { CategoryGlyphName } from "#src/enums/category-glyph-name.enum";
import type { ComponentCategory } from "#src/enums/component-category.enum";

/** One showcase category. */
export interface CategoryEntry {
  /** The machine code; the title is `showcase::category.<id>.title`. */
  readonly id: ComponentCategory;
  /** The brand glyph the category wears. */
  readonly glyph: CategoryGlyphName;
  /** The 0-based place in navigation order. */
  readonly order: number;
}
