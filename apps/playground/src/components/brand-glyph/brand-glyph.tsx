/**
 * Stackra file contract:
 * Purpose: the Stackra brand icons the playground's showcase draws (category panels, the hero's glass tiles): square
 *          caps and mitred joins on a 24px grid, in `currentColor`, as the brand kit draws them.
 * Boundary: decoration only (`aria-hidden`); a glyph never carries meaning on its own. Paths copied from the stackra
 *          brand kit (`assets/icons/*.svg`); interface icons stay with @stackra/icons and the page registry.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0320 (glass and the showcase stage); the stackra brand kit.
 */
import type { BrandGlyphProps } from "./brand-glyph.props";
import { BRAND_GLYPHS } from "./brand-glyphs.constant";

/** One brand icon, decorative. */
export function BrandGlyph({ name, className = "size-6" }: BrandGlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      className={className}
    >
      {BRAND_GLYPHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
