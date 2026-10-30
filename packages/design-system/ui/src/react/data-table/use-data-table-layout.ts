/**
 * Stackra file contract:
 * Purpose: `useDataTableLayout()`, the rows and columns both runtimes' `DataTable` hand their `Table` once the
 *          group-by, aggregates and hidden columns are applied: the hidden columns left out (never the row header), a
 *          heading row before each group carrying its name, count and aggregates, and a total row at the end when
 *          any aggregate is asked for. Summary rows are synthetic items whose ids start with `SUMMARY_PREFIX`.
 * Boundary: plain React, so the native table imports it too. It never sorts or filters: groups follow the order their
 *           value first appears in the rows on screen. The table keeps summary rows out of the selection and gives
 *           them no row actions.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); product audit 2026-10-28 (group-by, aggregates, column chooser);
 *          data-collection plan (owner, 2026-10-29): the groups and totals are the collection engine's.
 */
import type { ReactNode } from "react";

import type { AggregateKind } from "#contracts/enums/aggregate-kind.enum";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import { DATA_GRID_KEYS } from "#core/constants/data-grid-keys.constant";
import { collectionAggregatesOf } from "#core/functions/collection-aggregates-of.function";
import { collectionGroupsOf } from "#core/functions/collection-groups-of.function";
import { useUiText } from "#react/hooks/use-ui-text";

/** The id prefix of a group heading or total row; an app's ids never start with it. */
const SUMMARY_PREFIX = "data-table-summary:";

/** The id of the total row. */
const TOTAL_ID = `${SUMMARY_PREFIX}total`;

/** The words of the summary rows. */
const K = DATA_GRID_KEYS.ui.data_table_tools;

/** The table as drawn. */
interface DataTableLayout<TItem extends CollectionItem> {
  /** The rows, with a heading row per group and a total row when asked for. */
  readonly items: readonly TItem[];
  /** The columns not hidden. */
  readonly columns: readonly TableColumn[];
  /** True for a heading or total row. */
  readonly isSummary: (id: string) => boolean;
  /** True for the total row. */
  readonly isTotal: (id: string) => boolean;
  /** The cell of a summary row. */
  readonly summaryCell: (id: string, column: TableColumn) => ReactNode;
  /** The raw aggregate of a summary row's column, or `null`; the table formats it as the column's own cells. */
  readonly summaryValue: (id: string, column: TableColumn) => number | null;
  /** The name of a column's aggregate when it is not a sum ("Average"), so it never reads as a total; else `null`. */
  readonly summaryLabel: (column: TableColumn) => string | null;
}

/**
 * The DataTable's rows and columns with grouping, aggregates and hidden columns applied.
 * @param input - the rows, columns, group column, aggregates, hidden column ids and the locale for numbers
 * @returns what the table draws
 */
export function useDataTableLayout<TItem extends CollectionItem>({
  items,
  columns,
  groupBy,
  aggregates,
  hiddenColumns,
  locale,
}: {
  readonly items: readonly TItem[];
  readonly columns: readonly TableColumn[];
  readonly groupBy?: string | undefined;
  readonly aggregates?: Readonly<Record<string, AggregateKind>> | undefined;
  readonly hiddenColumns?: readonly string[] | undefined;
  readonly locale: string;
}): DataTableLayout<TItem> {
  const t = useUiText();
  const rowHeaderId = (columns.find((column) => column.isRowHeader) ?? columns[0])?.id;
  const shown = hiddenColumns?.length
    ? columns.filter((column) => column.id === rowHeaderId || !hiddenColumns.includes(column.id))
    : columns;
  const hasAggregates = aggregates !== undefined && Object.keys(aggregates).length > 0;
  if (!groupBy && !hasAggregates)
    return {
      items,
      columns: shown,
      isSummary: () => false,
      isTotal: () => false,
      summaryCell: () => null,
      summaryValue: () => null,
      summaryLabel: () => null,
    };

  const numbers = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const totals = aggregates ?? {};
  // The engine's groups and totals: one computation for the table, the list and the cards.
  const groups = groupBy
    ? collectionGroupsOf(items, groupBy, totals)
    : [{ key: "", items, aggregates: collectionAggregatesOf(items, totals) }];
  const byId = new Map<
    string,
    { readonly label: string; readonly values: Readonly<Record<string, number | null>> }
  >();
  const out: TItem[] = [];
  for (const group of groups) {
    if (groupBy) {
      const id = `${SUMMARY_PREFIX}group:${group.key}`;
      byId.set(id, {
        label: `${group.key} · ${t(K.group_count, { count: group.items.length })}`,
        values: group.aggregates,
      });
      out.push({ id } as TItem);
    }
    out.push(...group.items);
  }
  if (hasAggregates) {
    byId.set(TOTAL_ID, { label: t(K.total), values: collectionAggregatesOf(items, totals) });
    out.push({ id: TOTAL_ID } as TItem);
  }

  const summaryCell = (id: string, column: TableColumn): ReactNode => {
    const summary = byId.get(id);
    if (!summary) return null;
    if (column.id === rowHeaderId) return summary.label;
    if (!aggregates?.[column.id]) return null;
    const value = summary.values[column.id] ?? null;
    return value === null ? "" : numbers.format(value);
  };

  return {
    items: out,
    columns: shown,
    isSummary: (id) => id.startsWith(SUMMARY_PREFIX),
    isTotal: (id) => id === TOTAL_ID,
    summaryCell,
    summaryValue: (id, column) =>
      aggregates?.[column.id] ? (byId.get(id)?.values[column.id] ?? null) : null,
    summaryLabel: (column) => {
      const kind = aggregates?.[column.id];
      return kind && kind !== "sum" && column.id !== rowHeaderId ? t(K[`aggregate_${kind}`]) : null;
    },
  };
}
