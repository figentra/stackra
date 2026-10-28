/**
 * Stackra file contract:
 * Purpose: `unknownViewKeys`, the server validator of a saved view: the keys it names that its resource's recorded
 *          table does not declare.
 * Boundary: pure. Declared are the table's column keys, its filter keys (`trashed` for the trashed filter), and for a
 *           sort the sortable columns plus the default and tiebreak sort keys. Columns, groups, totals and the layout
 *           path must be columns. A resource with no recorded table declares nothing, so every key is unknown, and a
 *           view with no keys passes. A `Report` target is not checked here yet (stackra-389 owns the report kind).
 * Runtime: isomorphic
 * Governing contract: ADR 0271 (decision 4); ADR 0307 (rules 5 and 9: views store declared keys only).
 */
import type { SavedView } from "#core/schemas/saved-view.schema";
import type { TableNode } from "#core/types/table-node.type";

/**
 * The undeclared keys of `view`, in the order it names them, without repeats.
 *
 * @example
 * unknownViewKeys(view, resourceTreeOf(view.resource).table); // [] when every key is declared
 */
export function unknownViewKeys(
  view: Pick<SavedView, "filter" | "sort" | "columns" | "group" | "totals" | "layoutBy">,
  table: TableNode | undefined,
): string[] {
  const columns = new Set(table?.columns.map((column) => column.key));
  const filters = new Set(
    table?.filters.map((filter) => (filter.kind === "trashed" ? "trashed" : filter.key)),
  );
  const sorts = new Set([
    ...(table?.columns.filter((column) => column.sortable === true) ?? []).map(({ key }) => key),
    ...(table?.defaultSort === undefined ? [] : [table.defaultSort.key]),
    ...(table?.thenSort ?? []).map(({ key }) => key),
  ]);
  const unknown = new Set<string>();
  const check = (keys: readonly (string | undefined)[], declared: ReadonlySet<string>) => {
    for (const key of keys) if (key !== undefined && !declared.has(key)) unknown.add(key);
  };
  check(Object.keys(view.filter), filters);
  check([view.sort?.key], sorts);
  check(view.columns ?? [], columns);
  check([view.group?.by, view.group?.then], columns);
  check(
    view.totals.map(({ key }) => key),
    columns,
  );
  check([view.layoutBy], columns);
  return [...unknown];
}
