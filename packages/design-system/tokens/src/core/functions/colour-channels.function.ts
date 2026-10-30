/**
 * Stackra file contract:
 * Purpose: `colourChannels(colour)`, the sRGB channels of a colour in the forms themes and Uniwind hand back: `#RGB`,
 *          `#RRGGBB`, `#RRGGBBAA`, `rgb()`/`rgba()` and `oklch()`, for `barContentOn` and `barTint`.
 * Boundary: pure; the alpha is dropped; a colour it cannot read gives undefined, never an exception.
 * Runtime: isomorphic
 * Governing contract: owner decision 2026-10-28 (the bars follow the theme); CSS Color 4.
 */
import { oklchToHex } from "#core/functions/oklch-to-hex.function";

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i;

/**
 * The 0 to 255 sRGB channels of `colour`, or undefined.
 *
 * @example
 * colourChannels("#F9F7EE"); // [249, 247, 238]
 */
export function colourChannels(colour: string): readonly [number, number, number] | undefined {
  const text = colour.trim();
  const rgb = RGB.exec(text);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  let hex = text;
  if (/^oklch\(/i.test(text))
    try {
      hex = oklchToHex(text);
    } catch {
      return undefined;
    }
  const match = HEX.exec(hex);
  if (!match?.[1]) return undefined;
  const digits =
    match[1].length === 3 ? [...match[1]].map((digit) => digit + digit).join("") : match[1];
  return [0, 2, 4].map((at) => Number.parseInt(digits.slice(at, at + 2), 16)) as [
    number,
    number,
    number,
  ];
}
