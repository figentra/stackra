/**
 * Stackra file contract:
 * Purpose: `defaultCollectionStateOf()`, the state a collection starts from: every column in its defined order, no sort, filter or search, the columns' own aggregates (with a footer on, the other number columns sum), page 0 of 25, normal density, the table layout.
 * Boundary: pure; `initial` overrides any part.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { AggregateKind } from "#contracts/enums/aggregate-kind.enum";
import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionState } from "#contracts/types/collection-state.type";

/** The rows per page when nothing says otherwise. */
const PAGE_SIZE = 25;

/**
 * The starting state.
 * @param columns - the definitions
 * @param initial - what the app sets at the start
 */
export function defaultCollectionStateOf(
  columns: readonly CollectionColumn[],
  initial: Partial<CollectionState> = {},
): CollectionState {
  const aggregates: Record<string, AggregateKind> = {};
  for (const column of columns) if (column.aggregate) aggregates[column.id] = column.aggregate;
  // Once a footer is asked for, every other number column sums by default; text columns show nothing.
  if (Object.keys(aggregates).length > 0)
    for (const column of columns)
      if (column.type === "number" && !column.aggregate) aggregates[column.id] = "sum";
  return {
    columns: columns.map((column) => ({ id: column.id })),
    sort: [],
    filter: { match: "all", conditions: [] },
    search: "",
    groupBy: null,
    aggregates,
    selection: [],
    isAllMatchingSelected: false,
    page: 0,
    pageSize: PAGE_SIZE,
    cursor: null,
    density: "normal",
    layout: "table",
    viewId: null,
    ...initial,
  };
}
