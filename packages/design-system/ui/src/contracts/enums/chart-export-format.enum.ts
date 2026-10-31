/**
 * Stackra file contract:
 * Purpose: `ChartExportFormat`, the files a chart can be saved or shared as: a PNG picture, the SVG drawing and its
 *          numbers as CSV.
 * Boundary: the values only; native has no SVG and leaves it out.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decisions 14 to 18); STA-1371 (gap wave, 2026-10-31).
 */

// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the formats carry no labels.
/** The export formats, in menu order. */
export const ChartExportFormat = Object.freeze(["png", "svg", "csv"] as const);

/** One export format. */
export type ChartExportFormat = (typeof ChartExportFormat)[number];
