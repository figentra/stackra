/**
 * Stackra file contract:
 * Purpose: `ReportResult`, the output of a report's generated query: one row per group (dimension and measure names to
 *          values), the grand totals of the requested measures over the whole filtered set, the next page's cursor, and
 *          on request the subtotals per leading dimension and the pivot matrix.
 * Boundary: a type only. Money values stay `{ minor, currency }` per currency (the mixed-currency guard). Every
 *           number here is computed by the server over the whole filtered set, never over the page on screen.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 3: `ReportResult`).
 */
import type { Json } from "@stackra/contracts";

import type { ReportPivot } from "#core/types/report-pivot.type";
import type { ReportSubtotal } from "#core/types/report-subtotal.type";

/** What a report run returns. */
export interface ReportResult {
  /** One row per group: dimension and measure names to values. */
  readonly rows: readonly Readonly<Record<string, Json>>[];

  /** The requested measures over the whole filtered set, not only this page. */
  readonly totals: Readonly<Record<string, Json>>;

  /** The cursor of the next page; null on the last page. */
  readonly cursor: string | null;

  /** The subtotal of each leading prefix of the page's groups, deepest first; present when the request asks. */
  readonly subtotals?: readonly ReportSubtotal[];

  /** The pivot matrix; present when the request names pivot axes. */
  readonly pivot?: ReportPivot;
}
