/**
 * Stackra file contract:
 * Purpose: `ResourceListState`, what a resource list holds between reads: the search text, the applied filter values,
 *          the sort, the cursor and the page size.
 * Boundary: a type only; `tableInput` turns it into the list query's input. Free of any UI kit, so web and native
 *           lists share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 2 and 11: the closed table input, the URL state).
 */
import type { SortNode } from "#core/types/sort-node.type";

/** One read of a resource list. */
export interface ResourceListState {
  /** The search text; empty means no search. */
  readonly search: string;

  /** The applied filter values, by row path (`trashed` for the trashed filter). */
  readonly filters: Readonly<Record<string, unknown>>;

  /** The sort in force, or null for the table's default. */
  readonly sort: SortNode | null;

  /** The opaque cursor of the page; absent for the first page. */
  readonly cursor?: string;

  /** How many rows a page holds. */
  readonly limit: number;
}
