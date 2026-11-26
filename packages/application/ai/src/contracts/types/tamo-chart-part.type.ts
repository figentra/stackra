/**
 * Stackra file contract:
 * Purpose: `TamoChartPart`, the data of a `data-tamo-chart` part: the chart kind, its series, the x field and
 *          the rows.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import type { TamoChartKind } from "#contracts/enums/tamo-chart-kind.enum";
import type { TamoChartCell } from "#contracts/types/tamo-chart-cell.type";
import type { TamoChartSeries } from "#contracts/types/tamo-chart-series.type";

/** A chart in a chat turn. */
export interface TamoChartPart {
  /** The chart to draw. */
  readonly kind: TamoChartKind;

  /** The plotted series, in legend order. */
  readonly series: readonly TamoChartSeries[];

  /** The row field on the x axis (or the category of a pie). */
  readonly x: string;

  /** The rows, each keyed by field. */
  readonly rows: readonly Readonly<Record<string, TamoChartCell>>[];
}
