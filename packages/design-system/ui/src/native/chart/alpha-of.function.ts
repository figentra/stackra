/**
 * Stackra file contract:
 * Purpose: `alphaOf`: a theme colour at an alpha, as a CSS rgba string, for the chart grid and cursor.
 * Boundary: a pure function over Skia's colour parser; not exported from the package.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); STA-1371.
 */
import { Skia } from "@shopify/react-native-skia";

/** `color` at `alpha` as a CSS rgba string. */
export function alphaOf(color: string, alpha: number): string {
  const [red = 0, green = 0, blue = 0] = Skia.Color(color);
  return `rgba(${Math.round(red * 255)}, ${Math.round(green * 255)}, ${Math.round(blue * 255)}, ${alpha})`;
}
