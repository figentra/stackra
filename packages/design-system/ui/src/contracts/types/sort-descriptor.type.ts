/**
 * Stackra file contract:
 * Purpose: which column a table is sorted by and in which direction. Stackra's pages are cursor pages that the server
 *          sorts, so the descriptor is controlled state the app turns into a query, never something a table applies
 *          to rows it holds.
 * Boundary: types only. `column` is the column's `id`; the same shape is React Aria's `SortDescriptor`, so the web
 *           table passes it through.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313; ADR 0294 (cursor pages, `Page.of`).
 */
import type { AriaSortDirection } from "#contracts/enums/aria-sort-direction.enum";

/** The sort of a table: one column and its direction. */
export interface SortDescriptor {
  /** The `id` of the sorted column. */
  readonly column: string;
  /** The direction the column is sorted in. */
  readonly direction: AriaSortDirection;
}
