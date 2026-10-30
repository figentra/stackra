/**
 * Stackra file contract:
 * Purpose: `ChartTooltipItem`, one entry of the payload Recharts hands a tooltip: the series' name and colour, its
 *          value and the row it came from.
 * Boundary: types only; the subset of Recharts' payload the web `ChartTooltip` reads.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0291 (ported code); WCAG 2.2 SC 1.4.11; STA-1371.
 */

/** One series' value at the pointed row. */
export interface ChartTooltipItem {
  readonly name?: unknown;
  /** A number is written by the tooltip's `formatValue`; a string is shown as already written. */
  readonly value?: unknown;
  readonly color?: string | undefined;
  readonly dataKey?: unknown;
  readonly type?: string | undefined;
  readonly payload?: unknown;
}
