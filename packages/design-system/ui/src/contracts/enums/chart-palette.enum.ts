/**
 * Stackra file contract:
 * Purpose: `ChartPalette`, the colour set a chart's series take by position: `accent`, five lightness steps of the
 *          theme's accent (the default, so every brand's charts match it), or `categorical`, the multi-hue set that
 *          stays apart under colour-blind vision, for series that must be told apart by more than lightness.
 * Boundary: names only; `chartColorOf` turns a position into `chart-ramp-<n>` or `chart-<n>`.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 9); chart style spec (2026-10-28) section 1; STA-1371.
 */

// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the palettes carry no labels.
export const ChartPalette = Object.freeze(["accent", "categorical"] as const);

/** One palette a chart's series are coloured from. */
export type ChartPalette = (typeof ChartPalette)[number];
