/**
 * Stackra file contract:
 * Purpose: an 8-bit sRGB colour in OKLab, the space `color-mix(in oklab, …)` interpolates in, so a check can mix
 *          the theme's colours the way the browser does.
 * Boundary: pure; Ottosson's matrices, as CSS Color 4 uses (the inverse of `oklchToHex`'s path).
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 4); CSS Color 4 (OKLab).
 */

const linear = (channel: number) => {
  const unit = channel / 255;
  return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
};

/**
 * The OKLab coordinates of an sRGB colour.
 * @param rgb - red, green and blue, 0 to 255
 * @returns lightness (0 to 1) and the a and b axes
 */
export function srgbToOklab(rgb: readonly [number, number, number]): [number, number, number] {
  const [red, green, blue] = rgb.map(linear) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
