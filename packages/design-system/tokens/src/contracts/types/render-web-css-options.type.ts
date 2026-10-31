/**
 * Stackra file contract:
 * Purpose: `RenderWebCssOptions`: where `renderWebCss` writes a theme, the whole page or one section that wears its
 *          own theme (a nested theme, ADR 0501 section 4).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2).
 */
/** Where `renderWebCss` writes: the whole page, or one section that wears its own theme. */
export interface RenderWebCssOptions {
  /**
   * A selector (`[data-preset="heroui"]`) to write the theme's variable blocks under, for a nested theme: only the
   * variables are written, since the component rules are the page theme's and read them.
   */
  readonly scope?: string | undefined;
}
