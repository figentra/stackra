/**
 * Stackra file contract:
 * Purpose: every font stack of a theme and the CSS custom property it renders as, without the leading `--`: the
 *          camel-case display role `displayArabic` becomes `font-display-arabic`. `themeVariables` writes these and
 *          `defineTheme` reads them as the full set of families a text style may name (STA-1386).
 * Boundary: data only; one row per key of `FontFamilies`, which the type holds to the exact set.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
import type { FontFamilyName } from "#contracts/types/font-family-name.type";

/** Each font stack's custom property name, in the order the renderers write them. */
export const FONT_FAMILY_VARIABLES: Readonly<Record<FontFamilyName, string>> = Object.freeze({
  sans: "font-sans",
  mono: "font-mono",
  arabic: "font-arabic",
  display: "font-display",
  displayArabic: "font-display-arabic",
});
