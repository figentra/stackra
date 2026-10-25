/**
 * Stackra file contract:
 * Purpose: the contrast ratio of one pair in one scheme, as the components paint it: the background composited over
 *          the theme's `background` when translucent, the foreground composited over that, then WCAG's ratio.
 * Boundary: pure; a colour that cannot be measured (nothing paints the name, a hex does not parse, the page itself is
 *           translucent) gives `undefined`, never an exception.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 4); WCAG 2.2 (contrast ratio).
 */
import type { ContrastPair } from "#contracts/types/contrast-pair.type";
import type { PaintedColour } from "#contracts/types/painted-colour.type";
import type { Theme } from "#contracts/types/theme.type";
import { compositeColour } from "#core/functions/composite-colour.function";
import { contrastRatio } from "#core/functions/contrast-ratio.function";
import { paintedColour } from "#core/functions/painted-colour.function";

/** An opaque `#RRGGBB` as a painted colour. */
const opaque = (hex: string): PaintedColour => ({
  rgb: [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16)) as [
    number,
    number,
    number,
  ],
  alpha: 1,
});

/**
 * The ratio of `pair` in `mode`.
 * @param theme - the theme whose stylesheet is loaded
 * @param pair - the foreground and background, by painted name
 * @param mode - the colour scheme
 * @returns the WCAG ratio, 1 to 21, or undefined when a colour cannot be measured
 */
export function pairRatio(
  theme: Theme,
  pair: ContrastPair,
  mode: "light" | "dark",
): number | undefined {
  const page = paintedColour(theme, "background", mode);
  const bg = paintedColour(theme, pair.bg, mode);
  const fg = paintedColour(theme, pair.fg, mode);
  if (!page || !bg || !fg) return undefined;
  const ground = compositeColour(bg, page);
  const ink = ground === undefined ? undefined : compositeColour(fg, opaque(ground));
  return ground === undefined || ink === undefined ? undefined : contrastRatio(ink, ground);
}
