/**
 * Stackra file contract:
 * Purpose: `heatShadeOf`, the CSS colour of a heatmap shade: level 0 is the muted track, levels 1 to 4 mix the
 *          chart colour into the card's surface at rising strength, so every brand and scheme gets its own scale.
 * Boundary: pure; a CSS `color-mix()` value for a background.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); chart style spec (2026-10-28) section 1; STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** How much of the chart colour each level carries, in percent. */
const STRENGTH = [0, 30, 52, 76, 100] as const;

/** The background of `level` (0 to 4) in `color`. */
export function heatShadeOf(level: number, color: ChartColor): string {
  if (level <= 0) return "color-mix(in oklab, var(--muted) 14%, var(--surface))";
  return `color-mix(in oklab, var(--${color}) ${STRENGTH[Math.min(level, 4)] ?? 100}%, var(--surface))`;
}
