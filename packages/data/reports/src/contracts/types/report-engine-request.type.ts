/**
 * Stackra file contract:
 * Purpose: `ReportEngineRequest`, the caller's request as an engine reads it: dimensions (with a grain value), measures,
 *          filters by dimension name, sort, page size, cursor,
 *          the subtotals flag and pivot axes.
 * Boundary: a type only, engine-neutral; the core `ReportRequest` the generated query takes is assignable to it. The
 *           engine checks every name against the declaration; the cursor is the engine's own and opaque.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decisions 3 and 8); ADR 0307 (rule 2: the closed table filter values).
 */
import type { Json } from "@stackra/contracts";

/** What a caller asks an engine for. */
export interface ReportEngineRequest {
  /** The dimensions to group by, in order; a time dimension names one of its declared grains. */
  readonly dimensions: readonly { readonly name: string; readonly grain?: string }[];

  /** The measure names to compute; at least one. */
  readonly measures: readonly string[];

  /** Dimension name to a table filter value, applied after the default filter. */
  readonly filters?: Readonly<Record<string, Json>>;

  /** The sort keys (requested dimension or measure names), at most three. */
  readonly sort?: readonly { readonly key: string; readonly direction: "asc" | "desc" }[];

  /** The page size; the engine caps it. */
  readonly limit?: number;

  /** The cursor of the previous page's result. */
  readonly cursor?: string;

  /** Also return a subtotal for every leading prefix of the dimensions (not with a pivot, which has its margins). */
  readonly subtotals?: boolean;

  /** The dimensions laid out as rows and as columns of a pivot: every requested dimension on exactly one axis. */
  readonly pivot?: { readonly rows: readonly string[]; readonly columns: readonly string[] };
}
