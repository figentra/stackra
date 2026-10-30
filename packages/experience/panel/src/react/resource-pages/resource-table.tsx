/**
 * Stackra file contract:
 * Purpose: `ResourceTable`, the data table of a list query: the recorded columns (or the row's own keys), sort, the
 *          filter bar with search, cursor pagination, row actions and the bulk bar, drawn with `@stackra/ui`'s
 *          `DataTable` and `FilterBar`. The List page and every relation manager draw it.
 * Boundary: internal to the resource pages. Holds the list state (search, filters, sort, cursor history, selection)
 *           and reads one page with `useQuery`; `tableInput` builds the closed input, so only declared sorts and
 *           filters are sent. A cell shows an enum code by its label (`ResourceValue`); a value filter is a text filter
 *           until gen writes filter kinds; a range filter draws as a number range, a date range as two calendar days, is-null as
 *           yes or no, and contains and compare as text. A principal column shows the principal's name. A saved view
 *           (`view`) sets the columns shown and the filter values and sort the table starts with (`savedViewState`); the
 *           caller keys the table by view so a new view starts fresh. A preset view (`preset`) sets the filter values
 *           and sort the table starts with, and its fixed input goes with every read under the user's state, below a
 *           relation's bound keys (`tableInput`). A page that carries a count shows it beside the
 *           filter bar, capped as "10,000+" (`CrudService.table`'s `TableCount`).
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 1, 2, 9, 11 and 12); ADR 0164; ADR 0271 (decision 1); reporting gaps 5 and 7.
 */
import { useQuery } from "@stackra/clients/react";
import { Enum, SortDirection } from "@stackra/contracts";
import { useTranslation } from "@stackra/i18n/react";
import type {
  FilterDefinition,
  FilterState,
  ResourceQuery,
  TableColumn,
} from "@stackra/ui/contracts";
import { DataTable, EmptyState, FilterBar, Text } from "@stackra/ui/react";
import { useState, type ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { resourceLabel } from "#core/functions/resource-label.function";
import { savedViewState } from "#core/functions/saved-view-state.function";
import { tableInput } from "#core/functions/table-input.function";
import { valueAt } from "#core/functions/value-at.function";
import type { ColumnNode } from "#core/types/column-node.type";
import type { ResourceTableProps } from "#react/resource-pages/resource-table.props";
import { ResourceValue } from "#react/resource-pages/resource-value";

/** One row as the table holds it. */
type Row = Readonly<Record<string, unknown>> & { readonly id: string };

/** What the list query answers (`CrudService.table`'s page). */
interface Page {
  readonly items?: readonly Readonly<Record<string, unknown>>[];
  readonly nextCursor?: string;
  readonly hasMore?: boolean;
  readonly count?: { readonly value: number; readonly capped: boolean };
}

/** The columns a table without a recording shows: the first row's own scalar keys. */
const derived = (rows: readonly Row[]): ColumnNode[] =>
  Object.keys(rows[0] ?? {}).map((key) => ({ kind: "value", key }));

/** `@stackra/ui`'s sort direction of a wire direction, and back. */
const toUi = (direction: SortDirection) =>
  direction === SortDirection.Asc ? "ascending" : "descending";

/** One empty input for every render, so a default never changes identity. */
const NO_INPUT: Readonly<Record<string, unknown>> = {};

/**
 * One list query's rows as a data table.
 *
 * @example
 * <ResourceTable resourceKey="orders.order" label="Orders" query={ListOrdersQuery} pageSize={25} table={tree.table} />
 */
export function ResourceTable({
  resourceKey,
  label,
  query,
  input = NO_INPUT,
  table,
  pageSize,
  searchable = true,
  rowActions,
  bulkActions,
  emptyState,
  view,
  preset,
}: ResourceTableProps): ReactElement {
  const { t } = useTranslation();
  const [state, setState] = useState<ResourceQuery>(() => {
    const start = view ?? preset;
    return {
      search: "",
      // reason: a view's filter values were drawn by this same filter bar, or declared against its filters
      filterValues: (start?.filter ?? {}) as FilterState,
      sort:
        start?.sort === undefined
          ? null
          : { column: start.sort.key, direction: toUi(start.sort.direction) },
    };
  });
  const [cursors, setCursors] = useState<readonly (string | undefined)[]>([undefined]);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const cursor = cursors.at(-1);
  const sort =
    state.sort === null
      ? null
      : {
          key: state.sort.column,
          direction: state.sort.direction === "ascending" ? SortDirection.Asc : SortDirection.Desc,
        };
  const answer = useQuery(
    query,
    tableInput(
      table,
      {
        search: state.search,
        filters: state.filterValues,
        sort,
        limit: pageSize,
        ...(cursor === undefined ? {} : { cursor }),
      },
      preset?.input === undefined ? input : { ...preset.input, ...input },
    ) as never,
    { keepPreviousData: true },
  );
  const page = (answer.data ?? {}) as Page;
  const rows: Row[] = (page.items ?? []).map((item, index) => ({
    ...item,
    id: String(item["id"] ?? index),
  }));
  const nodes =
    view?.columns === undefined
      ? (table?.columns ?? derived(rows)).filter((column) => column.hidden !== true)
      : savedViewState(table, view).columns;
  const columns: TableColumn[] = nodes.map((column) => ({
    id: column.key,
    label: t(resourceLabel(resourceKey, "columns", column.key)),
    ...(column.sortable === true ? { isSortable: true } : {}),
  }));
  const filters: FilterDefinition[] = (table?.filters ?? []).map((filter) => {
    if (filter.kind === "trashed")
      return {
        id: "trashed",
        kind: "select",
        label: t(PANEL_KEYS.panel.resources.trashed),
        options: [
          { id: "with", label: t(PANEL_KEYS.panel.resources.trashed_with) },
          { id: "only", label: t(PANEL_KEYS.panel.resources.trashed_only) },
        ],
      };
    const filterLabel = t(resourceLabel(resourceKey, "filters", filter.key));
    // `tableInput` turns each drawn value into the kind's wire form (`filterWireValue`).
    if (filter.kind === "range") return { id: filter.key, kind: "number", label: filterLabel };
    if (filter.kind === "dateRange")
      return { id: filter.key, kind: "date-range", label: filterLabel };
    if (filter.kind === "isNull") return { id: filter.key, kind: "boolean", label: filterLabel };
    return filter.enum === undefined
      ? { id: filter.key, kind: "text", label: filterLabel }
      : {
          id: filter.key,
          kind: "select",
          label: filterLabel,
          options: Enum.values(filter.enum).map((code) => ({
            id: String(code),
            label: String(code),
          })),
        };
  });
  const onQueryChange = (next: ResourceQuery) => {
    setState(next);
    setCursors([undefined]);
    setSelected([]);
  };
  const shown = {
    ...state,
    sort:
      state.sort ??
      (table?.defaultSort === undefined
        ? null
        : { column: table.defaultSort.key, direction: toUi(table.defaultSort.direction) }),
  };
  const count =
    page.count === undefined ? null : (
      <Text tone="muted">
        {t(
          page.count.capped
            ? PANEL_KEYS.panel.resources.count_capped
            : PANEL_KEYS.panel.resources.count,
          { count: page.count.value },
        )}
      </Text>
    );
  const filterBar =
    searchable || filters.length > 0 ? (
      <>
        <FilterBar
          query={shown}
          onQueryChange={onQueryChange}
          filters={filters}
          searchLabel={t(PANEL_KEYS.panel.resources.search)}
        />
        {count}
      </>
    ) : (
      count
    );
  return (
    <DataTable
      label={label}
      columns={columns}
      items={rows}
      query={shown}
      onQueryChange={onQueryChange}
      renderCell={(row, column) => {
        const node = nodes.find((candidate) => candidate.key === column.id);
        const currency =
          node?.currency === undefined
            ? undefined
            : valueAt(row, node.currency.replace(/^record\./, ""));
        return (
          <ResourceValue
            resourceKey={resourceKey}
            path={column.id}
            kind={node?.kind ?? "value"}
            value={valueAt(row, column.id)}
            currency={currency}
            labels={node?.labels}
          />
        );
      }}
      {...(filterBar === null ? {} : { filterBar })}
      {...(rowActions === undefined ? {} : { rowActions })}
      {...(bulkActions === undefined
        ? {}
        : {
            selectionMode: "multiple" as const,
            selectedKeys: selected,
            onSelectionChange: setSelected,
            bulkActions: bulkActions(selected),
          })}
      isLoading={answer.isPending}
      loadingLabel={label}
      hasMore={page.hasMore === true}
      hasPrevious={cursors.length > 1}
      onNext={() => {
        if (page.nextCursor !== undefined) setCursors([...cursors, page.nextCursor]);
      }}
      onPrevious={() => setCursors(cursors.slice(0, -1))}
      {...(answer.error === null
        ? {}
        : {
            error: answer.error,
            onRetry: () => void answer.refetch(),
            retryLabel: t(PANEL_KEYS.panel.resources.retry),
          })}
      emptyState={emptyState ?? <EmptyState title={t(PANEL_KEYS.panel.resources.empty)} />}
    />
  );
}
