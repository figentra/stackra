/**
 * Stackra file contract:
 * Purpose: `CategoryGlyphProps`: props of `CategoryGlyph`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of {@link CategoryGlyph}. */
export interface CategoryGlyphProps {
  /** The category, by name. */
  category: string;
  /** Sizing and colour classes. */
  className?: string;
}
