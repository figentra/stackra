/**
 * Stackra file contract:
 * Purpose: `View`, the data constructor of a resource table's preset view (`View.of("closed", { status: [...] })`).
 * Boundary: pure: returns a frozen `ViewNode`; the views builder records through it. A view stores declared keys only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 6 and 9).
 */
import type { SortNode } from "#core/types/sort-node.type";
import type { ViewNode } from "#core/types/view-node.type";

/**
 * Builds the preset view nodes of a resource table.
 *
 * @example
 * View.of("paid_today", { status: [OrderStatus.Paid], paidAt: DateRange.today() }, {
 *   sort: { key: "paidAt", direction: SortDirection.Desc },
 * });
 */
export const View = Object.freeze({
  /** The preset view `name` with `filter` applied. */
  of: (
    name: string,
    filter: Readonly<Record<string, unknown>>,
    options: { readonly sort?: SortNode } = {},
  ): ViewNode => Object.freeze({ name, filter: Object.freeze({ ...filter }), ...options }),
});
