/**
 * Stackra file contract:
 * Purpose: `ReportRequest`, the input of a report's generated query: the dimensions to group by (with a grain for a
 *          time dimension), the measures to compute, filters by dimension name, sort, page size and cursor, and the
 *          subtotals flag and the pivot axes.
 * Boundary: a type only, the wire contract REST, MCP, the panel and agents send. Every name is a declared dimension
 *           or measure of the report; the runner refuses anything else (ADR 0470 decision 2). A filter value is the
 *           `@stackra/database` table filter vocabulary (`{ op: "range", from, to }`, ...), keyed by dimension name.
 *           Subtotals and the pivot matrix come back in `ReportResult` (stackra-391); a pivot is not paged.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 3: `ReportRequest`); ADR 0307 (rule 2: the closed table filter values).
 */
import type { Json } from "@stackra/contracts";

import type { TimeGrain } from "#core/enums/time-grain.enum";

/** What a caller asks a report for. */
export interface ReportRequest {
  /** The dimensions to group by, in order; a time dimension names one of its declared grains. */
  readonly dimensions: readonly { readonly name: string; readonly grain?: TimeGrain }[];

  /** The measure names to compute; at least one. */
  readonly measures: readonly string[];

  /** Dimension name to a table filter value, applied after the report's default filter. */
  readonly filters?: Readonly<Record<string, Json>>;

  /** The sort keys (dimension or measure names), at most three. */
  readonly sort?: readonly { readonly key: string; readonly direction: "asc" | "desc" }[];

  /** The page size; the runner caps it. */
  readonly limit?: number;

  /** The cursor of the previous page's result. */
  readonly cursor?: string;

  /** Also return a subtotal for every leading prefix of the dimensions (not with a pivot, which has its margins). */
  readonly subtotals?: boolean;

  /** The dimensions laid out as rows and as columns of a pivot: every requested dimension on exactly one axis. */
  readonly pivot?: { readonly rows: readonly string[]; readonly columns: readonly string[] };
}
