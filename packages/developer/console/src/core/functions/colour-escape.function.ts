/**
 * Stackra file contract:
 * Purpose: `colourEscape(hex, depth)`, the SGR foreground sequence of a `#rrggbb` colour at a colour depth: true
 *          colour, the nearest of the 256-colour cube, or the nearest of the 16 basic colours; empty at depth 0.
 * Boundary: pure. Hand-written because `node:util.styleText` has named colours only and reads the stream itself.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-020; ECMA-48 SGR.
 */
import { rgbOf } from "#core/functions/rgb-of.function";
import type { ConsoleMode } from "#core/types/console-mode.type";

/** The 16 basic colours as terminals commonly draw them, with their SGR codes. */
const BASIC: readonly (readonly [number, number, number, number])[] = [
  [0, 0, 0, 30],
  [205, 49, 49, 31],
  [13, 188, 121, 32],
  [229, 229, 16, 33],
  [36, 114, 200, 34],
  [188, 63, 188, 35],
  [17, 168, 205, 36],
  [229, 229, 229, 37],
  [102, 102, 102, 90],
  [241, 76, 76, 91],
  [35, 209, 139, 92],
  [245, 245, 67, 93],
  [59, 142, 234, 94],
  [214, 112, 214, 95],
  [41, 184, 219, 96],
  [255, 255, 255, 97],
];

/** A 0..255 channel → a 0..5 step of the 256-colour cube. */
const step = (channel: number) => Math.round((channel / 255) * 5);

/** The foreground escape of `hex` at `depth`. */
export function colourEscape(hex: string, depth: ConsoleMode["depth"]): string {
  if (depth === 0) return "";
  const [r, g, b] = rgbOf(hex);
  if (depth === 24) return `\u001B[38;2;${r};${g};${b}m`;
  if (depth === 8) {
    return `\u001B[38;5;${16 + 36 * step(r) + 6 * step(g) + step(b)}m`;
  }
  let best = BASIC[0] ?? [0, 0, 0, 30];
  let bestCost = Number.POSITIVE_INFINITY;
  for (const candidate of BASIC) {
    const cost = (candidate[0] - r) ** 2 + (candidate[1] - g) ** 2 + (candidate[2] - b) ** 2;
    if (cost < bestCost) [best, bestCost] = [candidate, cost];
  }
  return `\u001B[${best[3]}m`;
}
