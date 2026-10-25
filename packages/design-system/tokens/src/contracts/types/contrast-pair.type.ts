/**
 * Stackra file contract:
 * Purpose: one pair of painted colours the theme checks hold to a WCAG minimum: a text or mark colour over the colour
 *          under it, each named as the CSS custom property the components paint (`accent-soft-foreground` over
 *          `accent-soft`), so a value HeroUI derives with `color-mix` is measured as it is painted, not as declared.
 * Boundary: types only; `checkTheme` resolves each name (palette, then role, then HeroUI's derivation).
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decisions 3 and 4); WCAG 2.2 (1.4.3 text, 1.4.11 non-text).
 */

/** A foreground and background, by painted name, and the ratio they must reach in both schemes. */
export interface ContrastPair {
  /** The colour drawn on top: text, an icon or a focus ring. */
  readonly fg: string;
  /** The colour under it; a translucent one is composited over `background` first. */
  readonly bg: string;
  /** 4.5 for text (WCAG 1.4.3), 3 for focus rings and component edges (WCAG 1.4.11). */
  readonly min: 4.5 | 3;
}
