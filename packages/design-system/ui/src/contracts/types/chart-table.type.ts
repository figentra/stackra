/**
 * Stackra file contract:
 * Purpose: `ChartTable`, a chart's numbers as text: the header (the category column, then one per series) and one
 *          row per datum, every value written in the locale. The web draws it as the chart's data table, native speaks it.
 * Boundary: types only; `chartTableOf` builds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */

/** A chart's data as written text. */
export interface ChartTable {
  /** The column headers: the category, then each series' label. */
  readonly head: readonly string[];
  /** One row per datum: its category, then each series' value ("" for a gap). */
  readonly rows: readonly (readonly string[])[];
}
