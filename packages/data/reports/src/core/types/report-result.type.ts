/**
 * Stackra file contract:
 * Purpose: `ReportResult`, the output of a report's generated query: one row per group (dimension and measure names to
 *          values), the grand totals of the requested measures over the whole filtered set, and the next page's cursor.
 * Boundary: a type only. Money values stay `{ minor, currency }` per currency (the mixed-currency guard); the
 *           subtotals and the pivot matrix join this shape in stackra-391.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 3: `ReportResult`).
 */
import type { Json } from "@stackra/contracts";

/** What a report run returns. */
export interface ReportResult {
  /** One row per group: dimension and measure names to values. */
  readonly rows: readonly Readonly<Record<string, Json>>[];

  /** The requested measures over the whole filtered set, not only this page. */
  readonly totals: Readonly<Record<string, Json>>;

  /** The cursor of the next page; null on the last page. */
  readonly cursor: string | null;
}
