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
  return unit <= 0.040_45 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
};

/**
 * The OKLab coordinates of an sRGB colour.
 * @param rgb - red, green and blue, 0 to 255
 * @returns lightness (0 to 1) and the a and b axes
 */
export function srgbToOklab(rgb: readonly [number, number, number]): [number, number, number] {
  const [red, green, blue] = rgb.map(linear) as [number, number, number];
  const l = Math.cbrt(0.412_221_470_8 * red + 0.536_332_536_3 * green + 0.051_445_992_9 * blue);
  const m = Math.cbrt(0.211_903_498_2 * red + 0.680_699_545_1 * green + 0.107_396_956_6 * blue);
  const s = Math.cbrt(0.088_302_461_9 * red + 0.281_718_837_6 * green + 0.629_978_700_5 * blue);
  return [
    0.210_454_255_3 * l + 0.793_617_785 * m - 0.004_072_046_8 * s,
    1.977_998_495_1 * l - 2.428_592_205 * m + 0.450_593_709_9 * s,
    0.025_904_037_1 * l + 0.782_771_766_2 * m - 0.808_675_766 * s,
  ];
}
