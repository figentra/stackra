/**
 * Stackra file contract:
 * Purpose: the WCAG 2 contrast ratio of two opaque sRGB colours, so a page or a test checks a pairing from the colours
 *          a browser paints (a theme's hex, derived from its oklch by `oklchToHex`).
 * Boundary: pure; opaque `#RRGGBB` only, since a ratio with a translucent colour depends on what is behind it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); WCAG 2.2 (relative luminance, contrast ratio).
 */

const HEX = /^#[0-9a-f]{6}$/i;

const luminance = (hex: string): number => {
  if (!HEX.test(hex)) throw new RangeError(`Not an opaque #RRGGBB colour: ${hex}`);
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const unit = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

/**
 * The WCAG 2 contrast ratio of two colours, 1 to 21, in either order.
 * @param one - an opaque `#RRGGBB` colour
 * @param two - another
 * @returns `(lighter + 0.05) / (darker + 0.05)`, unrounded
 * @throws RangeError when either is not `#RRGGBB`
 */
export function contrastRatio(one: string, two: string): number {
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const [high, low] = [luminance(one), luminance(two)].sort((x, y) => y - x) as [number, number];
  return (high + 0.05) / (low + 0.05);
}
