/**
 * Stackra file contract:
 * Purpose: a painted colour laid over the one under it, as the browser composites (source-over, in 8-bit sRGB), and
 *          the opaque result as `#RRGGBB`, so a translucent fill or text can be measured by `contrastRatio`.
 * Boundary: pure; the bottom colour must be opaque, or the result is undefined: what lies under a translucent bottom
 *           is not known.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 4: composite a translucent colour, never throw).
 */
import type { PaintedColour } from "#contracts/types/painted-colour.type";

/**
 * `top` over the opaque `bottom`, as `#RRGGBB`.
 * @param top - the colour drawn last, any alpha
 * @param bottom - the colour under it; must be opaque
 * @returns the composited hex, or undefined when `bottom` is translucent
 */
export function compositeColour(top: PaintedColour, bottom: PaintedColour): string | undefined {
  if (bottom.alpha < 0.999) return undefined;
  return `#${top.rgb
    .map((channel, index) => channel * top.alpha + (bottom.rgb[index] ?? 0) * (1 - top.alpha))
    .map((channel) =>
      Math.round(Math.min(255, Math.max(0, channel)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}
