/**
 * Stackra file contract:
 * Purpose: `tableInput(table, state)`, the list query's input for one read: `{ limit, cursor?, sort?, filter?,
 *          search? }`, the wire form `CrudService.table` reads.
 * Boundary: internal; pure. Keeps only what the table declares: a sort on a sortable column (else the default sort),
 *           filter values of declared filters, and a non-empty search. Without a recorded table, every value passes,
 *           and the server's closed `TableInput` still refuses an undeclared key.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2: the closed table input); ADR 0164.
 */
import type { ResourceListState } from "#core/types/resource-list-state.type";
import type { TableNode } from "#core/types/table-node.type";

/**
 * The list query's input for `state` under `table`.
 *
 * @example
 * tableInput(tree.table, { search: "", filters: { status: "paid" }, sort: null, limit: 25 });
 * // { limit: 25, sort: { key: "createdAt", direction: "desc" }, filter: { status: "paid" } }
 */
export function tableInput(
  table: TableNode | undefined,
  state: ResourceListState,
): Readonly<Record<string, unknown>> {
  const declared =
    table === undefined
      ? undefined
      : new Set(
          table.filters.map((filter) => (filter.kind === "trashed" ? "trashed" : filter.key)),
        );
  const filter = Object.fromEntries(
    Object.entries(state.filters).filter(
      ([key, value]) => value !== undefined && (declared === undefined || declared.has(key)),
    ),
  );
  const sortable =
    state.sort !== null &&
    (table === undefined ||
      table.columns.some((column) => column.key === state.sort?.key && column.sortable === true));
  const sort = sortable ? state.sort : (table?.defaultSort ?? null);
  const search = state.search.trim();
  return {
    limit: state.limit,
    ...(state.cursor === undefined ? {} : { cursor: state.cursor }),
    ...(sort === null ? {} : { sort }),
    ...(Object.keys(filter).length === 0 ? {} : { filter }),
    ...(search === "" ? {} : { search }),
  };
}
