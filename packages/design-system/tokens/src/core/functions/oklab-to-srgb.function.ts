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
  return 255 * (clipped <= 0.0031308 ? 12.92 * clipped : 1.055 * clipped ** (1 / 2.4) - 0.055);
};

/**
 * The sRGB channels of an OKLab colour.
 * @param lab - lightness (0 to 1) and the a and b axes
 * @returns red, green and blue, 0 to 255, clipped and unrounded
 */
export function oklabToSrgb(lab: readonly [number, number, number]): [number, number, number] {
  const [lightness, a, b] = lab;
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}
