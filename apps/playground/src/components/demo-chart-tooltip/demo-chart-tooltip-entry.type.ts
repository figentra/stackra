/**
 * Stackra file contract:
 * Purpose: `DemoChartTooltipEntry`: one row of a tooltip's payload, as far as the card reads it.
 * Boundary: a type only, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0305 (rule 10).
 */

/** One row of a tooltip's payload, as far as the card reads it. */
export interface DemoChartTooltipEntry {
  /** The data key of the series; the row's key. */
  readonly dataKey?: unknown;
  /** The colour of the series; a CSS colour. */
  readonly color?: string | undefined;
  /** The name of the series. */
  readonly name?: string | number | undefined;
  /** The value at the point. */
  readonly value?: unknown;
}
