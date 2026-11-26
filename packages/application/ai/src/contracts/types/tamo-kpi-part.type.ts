/**
 * Stackra file contract:
 * Purpose: `TamoKpiPart`, the data of a `data-tamo-kpi` part: a band of key figures.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import type { TamoKpiMetric } from "#contracts/types/tamo-kpi-metric.type";

/** Key figures in a chat turn. */
export interface TamoKpiPart {
  /** The figures, in order. */
  readonly metrics: readonly TamoKpiMetric[];
}
