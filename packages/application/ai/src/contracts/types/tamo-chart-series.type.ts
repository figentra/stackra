/**
 * Stackra file contract:
 * Purpose: `TamoChartSeries`, one series of a `TamoChartPart`: the row field it plots and its label.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
/** One series of a chart part. */
export interface TamoChartSeries {
  /** The row field the series plots. */
  readonly field: string;

  /** The series name in the legend. */
  readonly label: string;
}
