/**
 * Stackra file contract:
 * Purpose: an OKLab colour back in 8-bit sRGB, clipped to the gamut as a browser paints it, after a `color-mix(in
 *          oklab, …)` has been evaluated.
 * Boundary: pure; Ottosson's matrices, as `oklchToHex` uses; channels are left unrounded.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 4); CSS Color 4 (OKLab).
 */

const encode = (linear: number) => {
  const clipped = Math.min(1, Math.max(0, linear));
  return 255 * (clipped <= 0.003_130_8 ? 12.92 * clipped : 1.055 * clipped ** (1 / 2.4) - 0.055);
};

/**
 * The sRGB channels of an OKLab colour.
 * @param lab - lightness (0 to 1) and the a and b axes
 * @returns red, green and blue, 0 to 255, clipped and unrounded
 */
export function oklabToSrgb(lab: readonly [number, number, number]): [number, number, number] {
  const [lightness, a, b] = lab;
  const l = (lightness + 0.396_337_777_4 * a + 0.215_803_757_3 * b) ** 3;
  const m = (lightness - 0.105_561_345_8 * a - 0.063_854_172_8 * b) ** 3;
  const s = (lightness - 0.089_484_177_5 * a - 1.291_485_548 * b) ** 3;
  return [
    encode(4.076_741_662_1 * l - 3.307_711_591_3 * m + 0.230_969_929_2 * s),
    encode(-1.268_438_004_6 * l + 2.609_757_401_1 * m - 0.341_319_396_5 * s),
    encode(-0.004_196_086_3 * l - 0.703_418_614_7 * m + 1.707_614_701 * s),
  ];
}
