/**
 * Stackra file contract:
 * Purpose: `ReportEngineResult`, what an engine returns for one run: one row per group, the grand totals over the whole
 *          filtered set, the next page's cursor, and on request the subtotals and the pivot matrix.
 * Boundary: a type only, engine-neutral and the same shape as core `ReportResult`, which `ReportRunner` hands on
 *           unchanged. Money stays `{ minor, currency }` per currency: an engine refuses a group that mixes currencies.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decisions 3 and 8); ADR 0307 (rule 16: money never mixes currencies).
 */
import type { Json } from "@stackra/contracts";

import type { ReportEnginePivot } from "#contracts/types/report-engine-pivot.type";
import type { ReportEngineSubtotal } from "#contracts/types/report-engine-subtotal.type";

/** What an engine run returns. */
export interface ReportEngineResult {
  /** One row per group: dimension and measure names to values. */
  readonly rows: readonly Readonly<Record<string, Json>>[];

  /** The requested measures over the whole filtered set, not only this page. */
  readonly totals: Readonly<Record<string, Json>>;

  /** The cursor of the next page; null on the last page. */
  readonly cursor: string | null;

  /** The subtotal of each leading prefix of the page's groups, deepest first; present when the request asks. */
  readonly subtotals?: readonly ReportEngineSubtotal[];

  /** The pivot matrix; present when the request names pivot axes. */
  readonly pivot?: ReportEnginePivot;
}
