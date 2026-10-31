/**
 * Stackra file contract:
 * Purpose: `gradientColours(stops, count)`, `count` `#rrggbb` colours spread evenly across the stops, interpolated in
 *          OKLab so the middle of a gradient does not go muddy.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-016; OKLab (Björn Ottosson, 2020).
 */
import { rgbOf } from "#core/functions/rgb-of.function";

/** sRGB channel 0..255 → linear 0..1. */
const linear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** Linear 0..1 → sRGB channel 0..255. */
const encoded = (value: number) => {
  const c = value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
};

/** `#rrggbb` → OKLab. */
function toLab(hex: string): [number, number, number] {
  const [r, g, b] = rgbOf(hex).map(linear) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLab → `#rrggbb`. */
function toHex([L, a, b]: readonly [number, number, number]): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return `#${rgb.map((value) => encoded(value).toString(16).padStart(2, "0")).join("")}`;
}

/** `count` colours from the first stop to the last. */
export function gradientColours(stops: readonly string[], count: number): string[] {
  const labs = stops.map(toLab);
  if (labs.length === 0) return [];
  if (labs.length === 1 || count <= 1)
    return Array.from({ length: Math.max(count, 0) }, () => stops[0] ?? "#ffffff");
  return Array.from({ length: count }, (_, index) => {
    const position = (index / (count - 1)) * (labs.length - 1);
    const at = Math.min(Math.floor(position), labs.length - 2);
    const t = position - at;
    const from = labs[at] ?? [0, 0, 0];
    const to = labs[at + 1] ?? from;
    return toHex(
      [0, 1, 2].map((i) => (from[i] ?? 0) + ((to[i] ?? 0) - (from[i] ?? 0)) * t) as [
        number,
        number,
        number,
      ],
    );
  });
}
