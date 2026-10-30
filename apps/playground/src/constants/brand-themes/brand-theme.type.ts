/**
 * Stackra file contract:
 * Purpose: `BrandTheme`: one approved brand layer (or inspired-by preset) the showcase offers: its id, names, display
 *          faces, the vendored `stackra.theme-diff/2` layer and, for a preset, its CSS layer.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0340 (decisions 2, 8 and 11: a brand is a layer above Stackra).
 */

/** One approved brand layer, as the brand repo's `brand.json` and `tokens/theme.json` describe it. */
export interface BrandTheme {
  /** The brand repo's folder name (`brands/<id>`). */
  readonly id: string;
  /** The brand's name in English and Arabic. */
  readonly name: { readonly en: string; readonly ar: string };
  /** The CSS family of the brand's Latin display face (`brand.json` `fonts.display`). */
  readonly display: string;
  /** The CSS family of the brand's Arabic display face (`brand.json` `fonts.arabic`). */
  readonly displayArabic: string;
  /** The vendored `tokens/theme.json`, a changes-only layer over the Stackra theme. */
  readonly layer: unknown;
  /** A preset's CSS for what its tokens cannot say, drawn only while it is picked (`brandThemeCss`). */
  readonly css?: string;
}
