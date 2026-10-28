/**
 * Stackra file contract:
 * Purpose: the sRGB hex of an `oklch()` colour, so a theme's hex values are derived from its oklch values and cannot
 *          drift from what a browser paints.
 * Boundary: pure; parses `oklch(L C H)` and `oklch(L C H / A)` with plain numbers, the form themes are written in.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); CSS Color 4 (OKLab, sRGB transfer function).
 */

const OKLCH = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/;

const clip = (channel: number) => Math.min(1, Math.max(0, channel));
const encode = (linear: number) =>
  linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
const byte = (unit: number) =>
  Math.round(clip(unit) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();

/**
 * The `#RRGGBB` (or `#RRGGBBAA` when the colour has an alpha) sRGB hex of an `oklch()` colour. Out-of-gamut channels
 * are clipped to sRGB, as Chromium paints them.
 * @param oklch - a CSS colour such as `oklch(0.5 0.13 135)` or `oklch(0.158 0.005 248 / 0.4)`
 * @returns the hex, upper case
 * @throws RangeError when `oklch` is not that form
 */
export function oklchToHex(oklch: string): string {
  const match = OKLCH.exec(oklch.trim());
  if (!match) throw new RangeError(`Not an oklch(L C H [/ A]) colour: ${oklch}`);
  const [lightness, chroma, hue] = match.slice(1, 4).map(Number) as [number, number, number];
  // OKLCh to OKLab to LMS to linear sRGB (Ottosson's matrices, as CSS Color 4 uses).
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const alpha = match[4] === undefined ? "" : byte(Number(match[4]));
  return `#${rgb.map((linear) => byte(encode(clip(linear)))).join("")}${alpha}`;
}
