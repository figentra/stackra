/**
 * Stackra file contract:
 * Purpose: `ChartColor`, the theme colours a chart series may take: the five accent steps `chart-ramp-<n>` (the
 *          default palette), the five categorical `chart-<n>` tokens and the four status roles, each read as the theme's own custom property so brands, dark mode and the theme studio
 *          repaint a chart with no code.
 * Boundary: names only; web reads `var(--<name>)`, native the Uniwind variable `--color-<name>`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */

// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the colours carry no labels.
export const ChartColor = Object.freeze([
  "chart-ramp-1",
  "chart-ramp-2",
  "chart-ramp-3",
  "chart-ramp-4",
  "chart-ramp-5",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "accent",
  "success",
  "warning",
  "danger",
] as const);

/** One theme colour a series is drawn in. */
export type ChartColor = (typeof ChartColor)[number];
