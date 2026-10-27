/**
 * Stackra file contract:
 * Purpose: the Stackra brand icons the design-system landing draws (the gallery's category marks, a hero tile):
 *          square caps and mitred joins on a 24pt grid, as the brand kit draws them.
 * Boundary: decoration only (hidden from assistive technology); a glyph never carries meaning on its own. Paths copied
 *          from the web playground's `brand-glyph` (an app may not import another app); interface icons stay with
 *          @stackra/icons.
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); the stackra brand kit.
 */
import Svg, { Path } from "react-native-svg";
import type { BrandGlyphProps } from "./brand-glyph.props";
import { BRAND_GLYPHS } from "./brand-glyphs.constant";

/** One brand icon, decorative. */
export function BrandGlyph({ name, color, size = 24 }: BrandGlyphProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {BRAND_GLYPHS[name].map((d) => (
        <Path key={d} d={d} />
      ))}
    </Svg>
  );
}
