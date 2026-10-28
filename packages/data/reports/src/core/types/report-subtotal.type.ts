/**
 * Stackra file contract:
 * Purpose: `ReportSubtotal`, one subtotal of a grouped report run: the measures over every row that shares the values of
 *          the first `level` requested dimensions.
 * Boundary: a type only, returned in `ReportResult.subtotals` when the request asks for `subtotals`. Values hold the
 *           first `level` dimensions and the requested measures; money stays `{ minor, currency }`. The same shape as
 *           `ReportEngineSubtotal` of `./contracts`.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 3: subtotals computed on the server).
 */
import type { Json } from "@stackra/contracts";

/** The measures of one leading group of dimensions. */
export interface ReportSubtotal {
  /** How many leading dimensions the subtotal keeps: 1 for the first dimension alone, up to one less than all. */
  readonly level: number;

  /** The kept dimensions' values and the measures, by name. */
  readonly values: Readonly<Record<string, Json>>;
}
