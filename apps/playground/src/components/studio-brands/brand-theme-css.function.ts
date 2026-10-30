/**
 * Stackra file contract:
 * Purpose: `brandThemeCss`: the stylesheet a brand draws the showcase with: its theme as web CSS, its display faces
 *          as `--brand-font-display` and `--brand-font-display-arabic` (falling back to the UI faces) and a preset's CSS.
 * Boundary: pure; the faces are loaded by `styles/brand-fonts.css`.
 * Runtime: browser
 * Governing contract: ADR 0340 (decision 2).
 */
import { renderWebCss } from "@stackra/tokens";

import type { BrandTheme } from "#src/constants/brand-themes";

import { brandThemeOf } from "./brand-theme-of.function";

/** The CSS of `brand`'s theme and display faces. */
export function brandThemeCss(brand: BrandTheme): string {
  const faces = `:root{--brand-font-display:"${brand.display}",var(--font-sans);--brand-font-display-arabic:"${brand.displayArabic}",var(--font-arabic);}`;
  return `${renderWebCss(brandThemeOf(brand))}\n${faces}\n${brand.css ?? ""}`;
}
