/**
 * Stackra file contract:
 * Purpose: the CSS stack a theme sets one font family in, with the optional display roles resolved: `display` falls
 *          back to `sans` and `displayArabic` to `arabic` (STA-1386, brand rules §33). The renderers and anything that
 *          reads a text style's family go through it rather than indexing `fontFamily`.
 * Boundary: pure; validates nothing (`defineTheme` does).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System).
 */
import type { FontFamilyName } from "#contracts/types/font-family-name.type";
import type { Theme } from "#contracts/types/theme.type";

/** The stack `theme` sets `family` in. */
export function fontStackOf(theme: Theme, family: FontFamilyName): string {
  const { fontFamily } = theme;
  if (family === "display") return fontFamily.display ?? fontFamily.sans;
  if (family === "displayArabic") return fontFamily.displayArabic ?? fontFamily.arabic;
  return fontFamily[family];
}
