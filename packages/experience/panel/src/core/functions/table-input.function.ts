/**
 * Stackra file contract:
 * Purpose: `tableInput(table, state, fixed?)`, the list query's input for one read: `{ limit, cursor?, sort?, filter?,
 *          search? }`, the wire form `CrudService.table` reads, over the fixed input of a relation or a preset view.
 * Boundary: internal; pure. Keeps only what the table declares: a sort on a sortable column (else the default sort,
 *           as a list of keys when it has tiebreak keys), filter values of declared filters in their kind's wire form
 *           (`filterWireValue`; an empty one is not sent), and a non-empty search. Without a recorded table, every value passes,
 *           and the server's closed `TableInput` still refuses an undeclared key. The fixed input is the author's
 *           (typed by the query's input), so it passes as is, under the user's state: a key both set takes the user's
 *           value, and a fixed `filter` object is merged one level, the user's filter values winning.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2: the closed table input); ADR 0164; reporting gap 5.
 */
import { filterWireValue } from "#core/functions/filter-wire-value.function";
import type { ResourceListState } from "#core/types/resource-list-state.type";
import type { TableNode } from "#core/types/table-node.type";

/**
 * The list query's input for `state` under `table`.
 *
 * @example
 * tableInput(tree.table, { search: "", filters: { status: "paid" }, sort: null, limit: 25 });
 * // { limit: 25, sort: { key: "createdAt", direction: "desc" }, filter: { status: "paid" } }
 * tableInput(tree.table, state, { includeMerged: true }); // { includeMerged: true, limit: 25, ... }
 */
export function tableInput(
  table: TableNode | undefined,
  state: ResourceListState,
  fixed: Readonly<Record<string, unknown>> = {},
): Readonly<Record<string, unknown>> {
  const nodes =
    table === undefined
      ? undefined
      : new Map(
          table.filters.map((filter) => [
            filter.kind === "trashed" ? "trashed" : filter.key,
            filter,
          ]),
        );
  const filter = Object.fromEntries(
    Object.entries(state.filters).flatMap(([key, value]) => {
      if (value === undefined) return [];
      if (nodes === undefined) return [[key, value]];
      const node = nodes.get(key);
      if (node === undefined) return [];
      const wire = node.kind === "trashed" ? value : filterWireValue(node, value);
      return wire === undefined ? [] : [[key, wire]];
    }),
  );
  const sortable =
    state.sort !== null &&
    (table === undefined ||
      table.columns.some((column) => column.key === state.sort?.key && column.sortable === true));
  // A clicked column sorts alone; the declared default sort carries its tiebreak keys.
  const declared =
    table?.defaultSort === undefined ? [] : [table.defaultSort, ...(table.thenSort ?? [])];
  const sort =
    sortable && state.sort !== null
      ? state.sort
      : declared.length > 1
        ? declared
        : (declared[0] ?? null);
  const search = state.search.trim();
  const base = fixed["filter"];
  const filters =
    typeof base === "object" && base !== null && !Array.isArray(base)
      ? { ...(base as Readonly<Record<string, unknown>>), ...filter }
      : filter;
  return {
    ...fixed,
    limit: state.limit,
    ...(state.cursor === undefined ? {} : { cursor: state.cursor }),
    ...(sort === null ? {} : { sort }),
    ...(Object.keys(filters).length === 0 ? {} : { filter: filters }),
    ...(search === "" ? {} : { search }),
  };
}
