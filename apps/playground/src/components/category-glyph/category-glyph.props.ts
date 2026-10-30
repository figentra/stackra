/**
 * Stackra file contract:
 * Purpose: `CategoryGlyphProps`: props of `CategoryGlyph`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ComponentCategory } from "@stackra/showcase";

/** Props of {@link CategoryGlyph}. */
export interface CategoryGlyphProps {
  /** The category, by id. */
  category: ComponentCategory;
  /** Sizing and colour classes. */
  className?: string;
}
