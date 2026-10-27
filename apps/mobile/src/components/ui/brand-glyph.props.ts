/**
 * Stackra file contract:
 * Purpose: `BrandGlyphProps`: props of `BrandGlyph`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { BrandGlyphName } from "./brand-glyph-name.type";

/** Props of {@link BrandGlyph}. */
export interface BrandGlyphProps {
  /** Which brand icon. */
  name: BrandGlyphName;
  /** The stroke colour, a resolved theme colour. */
  color: string;
  /** The width and height, in points. */
  size?: number;
}
