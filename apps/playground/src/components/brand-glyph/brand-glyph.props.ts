/**
 * Stackra file contract:
 * Purpose: `BrandGlyphProps`: props of `BrandGlyph`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { BrandGlyphName } from "./brand-glyph-name.type";

/** Props of {@link BrandGlyph}. */
export interface BrandGlyphProps {
  /** Which brand icon. */
  name: BrandGlyphName;
  /** Sizing and colour classes; 24px when left out. */
  className?: string;
}
