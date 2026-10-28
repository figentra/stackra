/**
 * Stackra file contract:
 * Purpose: `savedViewState`, what a list draws for a saved view: the columns in the view's order, the filter values it
 *          starts with and its sort, so the web table and the native list apply a view the same way.
 * Boundary: pure and internal (the web and native renderers import it by path). It drops a column the table no longer
 *           has instead of failing, so a stale view still draws; the server validator refuses such a view on save.
 *           With no view, the table's own columns, defaults and sort.
 * Runtime: isomorphic
 * Governing contract: ADR 0271 (decisions 1 and 7); ADR 0307 (rule 9).
 */
import type { SavedView } from "#core/schemas/saved-view.schema";
import type { SavedViewState } from "#core/types/saved-view-state.type";
import type { TableNode } from "#core/types/table-node.type";

/**
 * The state `view` draws over `table`.
 *
 * @example
 * const { columns, filterValues, sort } = savedViewState(tree.table, view);
 */
export function savedViewState(
  table: TableNode | undefined,
  view: Pick<SavedView, "filter" | "sort" | "columns"> | undefined,
): SavedViewState {
  const all = (table?.columns ?? []).filter((column) => column.hidden !== true);
  const columns =
    view?.columns === undefined
      ? all
      : view.columns.flatMap((key) => all.filter((column) => column.key === key));
  const defaults = Object.fromEntries(
    (table?.filters ?? []).flatMap((filter) =>
      filter.kind !== "trashed" && filter.default !== undefined
        ? [[filter.key, filter.default]]
        : [],
    ),
  );
  return {
    columns,
    filterValues: { ...defaults, ...view?.filter },
    sort: view?.sort ?? table?.defaultSort,
  };
}
