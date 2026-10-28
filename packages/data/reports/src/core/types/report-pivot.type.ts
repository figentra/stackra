/**
 * Stackra file contract:
 * Purpose: `ReportPivot`, the matrix of a pivoted report run: the row keys, the column keys, the measures of each cell,
 *          and the totals of each row and each column (the grand total is `ReportResult.totals`).
 * Boundary: a type only, returned in `ReportResult.pivot` when the request names pivot axes. A key is the values of the
 *           axis's dimensions in the axis order; an axis with no dimension has one empty key. A cell with no row is
 *           `null`. The same shape as `ReportEnginePivot` of `./contracts`.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 3: a pivot over declared dimensions and measures).
 */
import type { Json } from "@stackra/contracts";

/** A pivot matrix. */
export interface ReportPivot {
  /** The row keys, in the requested sort. */
  readonly rows: readonly (readonly Json[])[];

  /** The column keys, in the requested sort. */
  readonly columns: readonly (readonly Json[])[];

  /** `cells[row][column]`: the measures by name, or `null` where no row falls. */
  readonly cells: readonly (readonly (Readonly<Record<string, Json>> | null)[])[];

  /** The measures over each row key, in `rows` order. */
  readonly rowTotals: readonly Readonly<Record<string, Json>>[];

  /** The measures over each column key, in `columns` order. */
  readonly columnTotals: readonly Readonly<Record<string, Json>>[];
}
