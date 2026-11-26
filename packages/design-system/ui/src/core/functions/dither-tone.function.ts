/**
 * Stackra file contract:
 * Purpose: `ditherTone`, the tone of one cell of a brand pattern through the ordered Bayer 8×8 dither: 2 (core) where
 *          the core channel passes the cell's threshold, 1 (steel line) where steel does, else 0 (the ground tile).
 * Boundary: pure maths, no DOM; ported as it is from the brand kit's generator (see ORIGIN.md).
 * Runtime: isomorphic
 * Governing contract: brand rules §40; ADR 0302 (decision 3); STA-2041.
 */
import type { DitherPattern } from "#contracts/enums/dither-pattern.enum";
import type { DitherSun } from "#contracts/types/dither-sun.type";
import { DITHER_FIELDS } from "#core/constants/dither-fields.constant";

/** Bayer 8×8 thresholds, 0..63. */
const BAYER8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28,
  52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7,
  39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
] as const;

/** The tone (0 tile, 1 steel line, 2 core) of cell (i, j) on a cols × rows grid at time t in seconds, the core glow
 * at `sun` when given. */
export function ditherTone(
  pattern: DitherPattern,
  i: number,
  j: number,
  cols: number,
  rows: number,
  t = 0,
  sun?: DitherSun,
): 0 | 1 | 2 {
  const [steel, core] = DITHER_FIELDS[pattern](i / cols, j / rows, t, cols / rows, sun);
  const threshold = ((BAYER8[(j & 7) * 8 + (i & 7)] ?? 0) + 0.5) / 64;
  if (core > threshold) return 2;
  return steel > threshold ? 1 : 0;
}
