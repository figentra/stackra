/**
 * Stackra file contract:
 * Purpose: `TamoKpiMetric`, one key figure of a `TamoKpiPart`: its label, value, the previous period's value,
 *          its format and, for money, its currency.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import type { TamoMetricFormat } from "#contracts/enums/tamo-metric-format.enum";

/** One key figure. */
export interface TamoKpiMetric {
  /** What the figure is, for example "Revenue". */
  readonly label: string;

  /** The figure for the period. */
  readonly value: number;

  /** The previous period's figure, for the trend; null or left out when there is none. */
  readonly previous?: number | null | undefined;

  /** How the value is formatted. */
  readonly format: TamoMetricFormat;

  /** The ISO 4217 code of a money figure. */
  readonly currency?: string | undefined;
}
