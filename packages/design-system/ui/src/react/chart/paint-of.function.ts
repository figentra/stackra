/**
 * Stackra file contract:
 * Purpose: `paintOf`, the CSS value of a theme colour for an SVG `fill` or `stroke`: `var(--<name>)`, which repaints
 *          with the theme, brand and scheme.
 * Boundary: pure; a presentation attribute, so no style tag or style attribute is written.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** The CSS value of a theme colour. */
export function paintOf(
  color: ChartColor | "muted" | "border" | "foreground" | "default" | "surface",
): string {
  return `var(--${color})`;
}
