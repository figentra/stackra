/**
 * Stackra file contract:
 * Purpose: `ChartSort`, the orders a bar, funnel or treemap chart can show its categories in: largest first, smallest
 *          first, or by label in the reader's alphabet.
 * Boundary: values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */

// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the orders carry no labels.
export const ChartSort = Object.freeze(["value-desc", "value-asc", "label"] as const);

/** One order of a chart's categories. */
export type ChartSort = (typeof ChartSort)[number];
