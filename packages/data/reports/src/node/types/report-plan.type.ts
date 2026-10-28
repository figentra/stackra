/**
 * Stackra file contract:
 * Purpose: `ReportPlan`, what `compileReport` makes of a report and a request: the select list, the grouping sets (with
 *          the subtotal or pivot shape they serve), the conditions, the money measures whose currencies are checked,
 *          and the page to read.
 * Boundary: a type only. The select and grouping text carries no bound values (grains and the time zone are checked
 *           literals), so the grouping expressions match the selected ones exactly; every caller value is in `where`.
 * Runtime: node
 * Governing contract: ADR 0470 (decision 3); ADR 0160.
 */
import type { SqlFragment } from "#node/types/sql-fragment.type";

/** A compiled report request. */
export interface ReportPlan {
  /** The report's written key. */
  readonly report: string;

  /** The requested dimension names, in order. */
  readonly dimensions: readonly string[];

  /** The requested measure names, in order. */
  readonly measures: readonly string[];

  /** The money measures checked for one currency: each selects `"<name>~currency"` and `"<name>~currencies"`. */
  readonly money: readonly string[];

  /** The requested money measures, returned as `{ minor, currency }`. */
  readonly moneyOut: readonly string[];

  /** `<expression> as "<alias>"` items; with dimensions also `"~grouping"` and `"~rank"`. */
  readonly selects: readonly string[];

  /** Subtotals per leading prefix of the dimensions were asked for. */
  readonly subtotals?: true;

  /** The pivot axes, when the request pivots; a pivot reads every cell up to the row cap and is not paged. */
  readonly pivot?: { readonly rows: readonly string[]; readonly columns: readonly string[] };

  /** The grouping sets: the full grouping, the subtotal prefixes or pivot margins, and `()`; absent without dimensions. */
  readonly groupBy?: string;

  /** The default filter and the request's filters ANDed; absent when there is none. */
  readonly where?: SqlFragment;

  /** The groups skipped before this page. */
  readonly offset: number;

  /** The page size, capped. */
  readonly limit: number;
}
