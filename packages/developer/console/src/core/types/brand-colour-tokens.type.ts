/**
 * Stackra file contract:
 * Purpose: `BrandColourTokens`, the part of a brand kit's DTCG `tokens/color.json` a theme reads: the palette, each
 *          colour with its `$value`.
 * Boundary: a type only; other token fields are ignored.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-017; W3C Design Tokens Community Group format.
 */

/** A brand's colour tokens. */
export interface BrandColourTokens {
  /** Colours by token name (`steel-500`), each holding `#rrggbb` in `$value`. */
  readonly palette: Readonly<Record<string, { readonly $value: string }>>;
}
