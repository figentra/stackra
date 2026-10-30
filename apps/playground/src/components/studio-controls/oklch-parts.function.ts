/**
 * Stackra file contract:
 * Purpose: `oklchParts`: the lightness, chroma and hue of a theme colour, so the controls can start from the theme's
 *          own colours; an `oklch(l c h)` colour is read as written, anything else (a brand's `#RRGGBB`) from its hex.
 * Boundary: pure; a colour with neither gives undefined.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */
import { srgbToOklab } from "@stackra/tokens";

/** The parts of `colour`, or of `hex` when `colour` is not written `oklch(l c h[ / a])`. */
export function oklchParts(
  colour: string,
  hex = colour,
): { readonly lightness: number; readonly chroma: number; readonly hue: number } | undefined {
  const match = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(colour.trim());
  if (match)
    return { lightness: Number(match[1]), chroma: Number(match[2]), hue: Number(match[3]) };
  if (!/^#[\dA-Fa-f]{6}/.test(hex.trim())) return undefined;
  const channels = [1, 3, 5].map((at) => Number.parseInt(hex.trim().slice(at, at + 2), 16));
  const [lightness, a, b] = srgbToOklab(channels as [number, number, number]);
  return {
    lightness,
    chroma: Math.hypot(a, b),
    hue: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360,
  };
}
