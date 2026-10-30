/**
 * Stackra file contract:
 * Purpose: `WidgetMenuAction`, the entries a widget's overflow menu can offer: download the data as CSV or the chart as
 *          a PNG (web), view the data as a table, open the widget full screen, and copy a link to it.
 * Boundary: values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decisions 14 to 18); ADR 0305 (one declaration per file); STA-1371.
 */

// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the words live in the ui catalogue.
/** The entries a widget overflow menu can offer. */
export const WidgetMenuAction = Object.freeze([
  "csv",
  "png",
  "svg",
  "table",
  "fullscreen",
  "link",
] as const);

/** One entry of a widget's overflow menu. */
export type WidgetMenuAction = (typeof WidgetMenuAction)[number];
