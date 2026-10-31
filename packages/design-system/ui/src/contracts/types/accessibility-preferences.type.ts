/**
 * Stackra file contract:
 * Purpose: `AccessibilityPreferences`, the accessibility modes a user turns on in the app on top of the system's own
 *          settings (ADR 0501): more contrast, reduced transparency, a larger web text scale and the colour-blind-safe
 *          chart palette. The web provider sets each on `<html>` (`data-contrast`, `data-transparency`,
 *          `data-text-scale`, `data-chart-palette`), where the theme's stylesheet reads it.
 * Boundary: types only. A mode left out follows the system setting alone (`prefers-contrast`,
 *           `prefers-reduced-transparency`, the browser's text size; native text follows Dynamic Type).
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, accessibility modes); ADR 0302 (decision 3).
 */

/** The accessibility modes a user turns on in the app. */
export interface AccessibilityPreferences {
  /** `more` swaps the theme's contrast roles in, whatever the system says. */
  readonly contrast?: "more" | undefined;
  /** `reduce` turns the glass material solid, whatever the system says. */
  readonly transparency?: "reduce" | undefined;
  /** A text scale the theme names (`large`, `larger`, `largest` in the stackra theme); web only. */
  readonly textScale?: string | undefined;
  /** `safe` draws charts in the theme's colour-blind-safe palette. */
  readonly chartPalette?: "safe" | undefined;
}
