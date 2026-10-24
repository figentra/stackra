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

/** The brand icons, by name: each a list of path data on the 24pt grid. */
const GLYPHS = {
  token: ["M8 4H5v16h3", "M16 4h3v16h-3", "M9 12h6"],
  pipeline: ["M3 12h4", "M7 9h4v6H7z", "M11 12h2", "M13 9h4v6h-4z", "M17 12h4"],
  docs: ["M6 3h9l4 4v14H6z", "M15 3v4h4", "M9 12h7", "M9 16h7"],
  link: ["M10 14l4-4", "M9 7l2-2a4 4 0 0 1 6 6l-2 2", "M15 17l-2 2a4 4 0 0 1-6-6l2-2"],
  module: ["M4 4h7v7H4z", "M13 4h7v7h-7z", "M4 13h7v7H4z", "M13 13h7v7h-7z"],
  alert: ["M12 3L2 21h20z", "M12 10v5", "M12 17v2"],
  terminal: ["M3 5h18v14H3z", "M7 9l3 3-3 3", "M12 15h5"],
  check: ["M4 12l5 5L20 6"],
  schema: ["M4 4h16v16H4z", "M4 9h16", "M9 9v11", "M12 13h5", "M12 16h3"],
  graph: ["M5 4h4v4H5z", "M15 4h4v4h-4z", "M10 16h4v4h-4z", "M7 8v3h10V8", "M12 11v5"],
  provider: ["M4 12h6", "M10 8h4v8h-4z", "M14 10h6", "M14 14h6"],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  package: ["M4 7l8-4 8 4v10l-8 4-8-4z", "M4 7l8 4 8-4", "M12 11v10"],
} as const satisfies Readonly<Record<string, readonly string[]>>;

/** The name of one brand icon. */
export type BrandGlyphName = keyof typeof GLYPHS;

/** Props of {@link BrandGlyph}. */
export interface BrandGlyphProps {
  /** Which brand icon. */
  name: BrandGlyphName;
  /** The stroke colour, a resolved theme colour. */
  color: string;
  /** The width and height, in points. */
  size?: number;
}

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
      {GLYPHS[name].map((d) => (
        <Path key={d} d={d} />
      ))}
    </Svg>
  );
}
