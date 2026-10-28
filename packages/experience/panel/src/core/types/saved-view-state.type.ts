/**
 * Stackra file contract:
 * Purpose: `SavedViewState`, what a list draws for a saved view: its visible columns in order, the filter values it
 *          starts with and its sort.
 * Boundary: a type only; built by `savedViewState`.
 * Runtime: isomorphic
 * Governing contract: ADR 0271 (decision 1); ADR 0307 (rule 9).
 */
import type { ColumnNode } from "#core/types/column-node.type";
import type { SortNode } from "#core/types/sort-node.type";

/** The drawn state of one view. */
export interface SavedViewState {
  /** The visible columns, in order. */
  readonly columns: readonly ColumnNode[];
  /** The filter values the list starts with, by filter key. */
  readonly filterValues: Readonly<Record<string, unknown>>;
  /** The sort the list starts with. */
  readonly sort: SortNode | undefined;
}
