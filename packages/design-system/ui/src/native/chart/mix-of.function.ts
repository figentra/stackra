/**
 * Stackra file contract:
 * Purpose: `mixOf`, `color` with a share of `other` mixed in, as a CSS rgba string: a mark's lit top (white) or its
 *          soft context tone (the surface), as the web marks mix theirs.
 * Boundary: pure over Skia's colour parser; mixes in sRGB, where the web mixes in oklab, a difference too small to see
 *           at these shares. Keeps `color`'s alpha.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import { Skia } from "@shopify/react-native-skia";

/** `color` with `share` (0 to 1) of `other` mixed in. */
export function mixOf(color: string, other: string, share: number): string {
  const [red = 0, green = 0, blue = 0, alpha = 1] = Skia.Color(color);
  const [toRed = 0, toGreen = 0, toBlue = 0] = Skia.Color(other);
  const at = (from: number, to: number) => Math.round((from * (1 - share) + to * share) * 255);
  return `rgba(${at(red, toRed)}, ${at(green, toGreen)}, ${at(blue, toBlue)}, ${alpha})`;
}
