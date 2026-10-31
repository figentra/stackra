/**
 * Stackra file contract:
 * Purpose: `listViewOf`, a panel view (a saved view of the `ViewStore`, a preset of the tree, or the all-rows view) as
 *          a `useCollection` `CollectionView`: its filter values as quick-filter conditions over the table's defaults,
 *          its sort, its columns (shown in its order, the rest hidden), its group left to the server (ADR 0470 decision 4), its totals (`aggregates`)
 *          and its layout (gallery as cards; calendar and chart keep the engine's). A value no quick filter can hold (a
 *          named date range, a value of an undeclared filter) is returned as `rest`, sent under the user's filters.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0271 (decisions 1 and 7); ADR 0505 (one saved-view model: the panel's views are engine
 *          views, groups and totals kept).
 */
import { SortDirection } from "@stackra/contracts";
import { collectionFilterWith, filterDefinitionsOf } from "@stackra/ui";
import type {
  AggregateKind,
  CollectionColumn,
  CollectionFilter,
  CollectionLayout,
  CollectionView,
  FilterDefinition,
  FilterValue,
} from "@stackra/ui/contracts";

import { savedViewState } from "#core/functions/saved-view-state.function";
import type { SavedView } from "#core/schemas/saved-view.schema";
import type { SortNode } from "#core/types/sort-node.type";
import type { TableNode } from "#core/types/table-node.type";

/** What a panel view sets. */
type ViewStart = Partial<Pick<SavedView, "columns" | "group" | "totals" | "layout">> & {
  readonly filter?: Readonly<Record<string, unknown>> | undefined;
  readonly sort?: SortNode | undefined;
};

/** The aggregates the engine knows. */
const KINDS: ReadonlySet<string> = new Set(["sum", "avg", "min", "max", "count"]);

/** A stored value in the shape of a quick filter of `kind`, or undefined when it has none. */
function valueOf(definition: FilterDefinition, raw: unknown): FilterValue | undefined {
  switch (definition.kind) {
    case "text":
    case "select": {
      return typeof raw === "string" ? raw : undefined;
    }
    case "multi-select": {
      return typeof raw === "string" ? [raw] : Array.isArray(raw) ? (raw as string[]) : undefined;
    }
    case "boolean": {
      return typeof raw === "boolean" ? raw : undefined;
    }
    case "number": {
      return typeof raw === "object" && raw !== null && ("min" in raw || "max" in raw)
        ? { min: null, max: null, ...(raw as object) }
        : undefined;
    }
    case "date-range": {
      // A stored day is ISO text; the quick filter writes it back with `toString()`, so text stands in for a day.
      return typeof raw === "object" && raw !== null && ("start" in raw || "end" in raw)
        ? ({ start: null, end: null, ...(raw as object) } as FilterValue)
        : undefined;
    }
  }
}

/** The engine layout of a panel layout, or undefined to keep the engine's. */
const LAYOUTS: Readonly<Record<string, CollectionLayout>> = {
  table: "table",
  board: "board",
  gallery: "cards",
};

/**
 * The engine view of a panel view.
 *
 * @example
 * const { view, rest } = listViewOf("view_1", "Paid", saved, tree.table, columns);
 */
export function listViewOf(
  id: string,
  label: string,
  start: ViewStart | undefined,
  table: TableNode | undefined,
  columns: readonly CollectionColumn[],
): { readonly view: CollectionView; readonly rest: Readonly<Record<string, unknown>> } {
  const { filterValues } = savedViewState(table, { filter: start?.filter ?? {} } as SavedView);
  const definitions = filterDefinitionsOf(columns);
  const rest: Record<string, unknown> = {};
  let filter: CollectionFilter = { match: "all", conditions: [] };
  for (const [key, raw] of Object.entries(filterValues)) {
    const definition = definitions.find((entry) => entry.id === key);
    const value = definition === undefined ? undefined : valueOf(definition, raw);
    if (definition !== undefined && value !== undefined)
      filter = collectionFilterWith(filter, definition, value);
    else rest[key] = raw;
  }
  const shown = start?.columns;
  const layout = start?.layout === undefined ? undefined : LAYOUTS[start.layout];
  const aggregates = Object.fromEntries(
    (start?.totals ?? []).flatMap((total) =>
      KINDS.has(total.aggregate) ? [[total.key, total.aggregate as AggregateKind]] : [],
    ),
  );
  return {
    view: {
      id,
      label,
      state: {
        filter,
        // The table's default sort stays out: the list query sends it with its tiebreak keys (`tableInput`).
        sort:
          start?.sort === undefined
            ? []
            : [
                {
                  column: start.sort.key,
                  direction:
                    start.sort.direction === SortDirection.Asc ? "ascending" : "descending",
                },
              ],
        ...(shown === undefined
          ? {}
          : {
              columns: [
                ...shown.map((key) => ({ id: key })),
                ...columns
                  .filter((column) => !shown.includes(column.id))
                  .map((column) => ({ id: column.id, isHidden: true })),
              ],
            }),
        // A paged list groups only once the server groups (ADR 0470 decision 4), so a view's group is not applied to one page.
        groupBy: null,
        aggregates,
        ...(layout === undefined ? {} : { layout }),
      },
    },
    rest,
  };
}
