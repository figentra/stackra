/**
 * Stackra file contract:
 * Purpose: `useDataGridModel()`, the state both runtimes' DataGrid share: the pending changes in `dataGridReducer`
 *          (undo and redo), each cell's value, text and error, the matrix totals, Save (which awaits `onSave`, then
 *          clears the changes) and Discard, and the save bar's words. Plain React, so the native grid imports it too.
 * Boundary: it never writes the rows; `onChangesChange` hears every change after the first render. Errors are
 *           checked on edited cells only, so saved data the app already holds is never flagged.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid); ADR 0505 (one column type); WCAG 2.2 SC 3.3.1.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { DataGridContractProps } from "#contracts/types/data-grid-contract-props.type";
import type { DataGridRow } from "#contracts/types/data-grid-row.type";
import type { DataGridValue } from "#contracts/types/data-grid-value.type";
import { DATA_GRID_KEYS } from "#core/constants/data-grid-keys.constant";
import { EMPTY_DATA_GRID_HISTORY } from "#core/constants/empty-data-grid-history.constant";
import { changedCellCountOf } from "#core/functions/changed-cell-count-of.function";
import { dataGridReducer } from "#core/functions/data-grid-reducer.function";
import { gridCellErrorOf } from "#core/functions/grid-cell-error-of.function";
import type { GridCellError } from "#core/types/grid-cell-error.type";
import type { DataGridModel } from "#react/data-grid/data-grid-model.type";
import type { DataGridWrite } from "#react/data-grid/data-grid-write.type";
import { useGridErrorText } from "#react/data-grid/use-grid-error-text";
import { useUiText } from "#react/hooks/use-ui-text";

/** The grid's words. */
const K = DATA_GRID_KEYS.ui.data_grid;

/** The columns a matrix draws: the first names the row and is read-only, the rest are quantities. */
function matrixColumnsOf(columns: readonly CollectionColumn[]): CollectionColumn[] {
  return columns.map((column, index) =>
    index === 0
      ? { ...column, isReadOnly: true }
      : { ...column, type: "number", min: column.min ?? 0 },
  );
}

/** A cell's copied text: booleans as TRUE or FALSE, a select as its option's label. */
const copyTextOf = (value: DataGridValue, column: CollectionColumn): string => {
  if (value === null) return "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (column.type === "choice")
    return column.options?.find((option) => option.id === value)?.label ?? String(value);
  return String(value);
};

/** A cell as a figure for the totals; anything but a number counts as zero. */
const quantity = (value: DataGridValue) => (typeof value === "number" ? value : 0);

/**
 * The DataGrid's shared state.
 * @param props - the grid's rows, columns, layout and callbacks
 * @param locale - the locale (with its digits) the cell text is written in
 */
export function useDataGridModel(
  {
    rows,
    columns: given,
    variant = "sheet",
    isReadOnly = false,
    onSave,
    onChangesChange,
  }: Pick<DataGridContractProps, "variant" | "isReadOnly" | "onSave" | "onChangesChange"> & {
    /** The rows drawn (the engine's). */
    readonly rows: readonly DataGridRow[];
    /** The columns drawn, in display order. */
    readonly columns: readonly CollectionColumn[];
  },
  locale: string,
): DataGridModel {
  const t = useUiText();
  const [history, dispatch] = useReducer(dataGridReducer, EMPTY_DATA_GRID_HISTORY);
  const { changes } = history;
  const columns = useMemo(
    () => (variant === "matrix" ? matrixColumnsOf(given) : given),
    [given, variant],
  );

  const reported = useRef(changes);
  useEffect(() => {
    if (reported.current === changes) return;
    reported.current = changes;
    onChangesChange?.(changes);
  }, [changes, onChangesChange]);

  const valueOf = useCallback(
    (row: DataGridRow, column: CollectionColumn): DataGridValue => {
      const changed = changes[row.id];
      if (changed && column.id in changed) return changed[column.id] ?? null;
      return row[column.id] ?? null;
    },
    [changes],
  );
  const isChanged = (row: DataGridRow, column: CollectionColumn) =>
    column.id in (changes[row.id] ?? {});

  const numbers = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const days = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }),
    [locale],
  );
  const textOf = (value: DataGridValue, column: CollectionColumn): string => {
    if (value === null) return "";
    if (typeof value === "number") return numbers.format(value);
    if (typeof value === "boolean") return t(value ? K.yes : K.no);
    if (column.type === "choice")
      return column.options?.find((option) => option.id === value)?.label ?? value;
    if (column.type === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value))
      return days.format(new Date(`${value}T00:00:00Z`));
    return value;
  };

  const wordsOf = useGridErrorText(locale);
  const rowById = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  const errors = useMemo(() => {
    const found = new Map<string, GridCellError>();
    for (const [rowId, changed] of Object.entries(changes)) {
      const row = rowById.get(rowId);
      if (!row) continue;
      const current: DataGridRow = { ...row, ...changed };
      for (const columnId of Object.keys(changed)) {
        const column = columns.find((candidate) => candidate.id === columnId);
        const error = column && gridCellErrorOf(current[columnId], column, current);
        if (error) found.set(`${rowId}\u0000${columnId}`, error);
      }
    }
    return found;
  }, [changes, columns, rowById]);
  const errorOf = (row: DataGridRow, column: CollectionColumn) => {
    const error = errors.get(`${row.id}\u0000${column.id}`);
    return error ? wordsOf(error) : undefined;
  };

  const isEditable = (column: CollectionColumn) => !isReadOnly && !column.isReadOnly;
  const write = (writes: readonly DataGridWrite[]) =>
    dispatch({
      type: "edit",
      edits: writes
        .filter(({ column }) => isEditable(column))
        .map(({ row, column, value }) => ({
          rowId: row.id,
          columnId: column.id,
          value,
          original: row[column.id],
        })),
    });

  const save = async () => {
    await onSave?.(changes);
    dispatch({ type: "reset" });
  };

  const rowTotalOf = (row: DataGridRow) =>
    columns.slice(1).reduce((total, column) => total + quantity(valueOf(row, column)), 0);
  const columnTotalOf = (column: CollectionColumn) =>
    rows.reduce((total, row) => total + quantity(valueOf(row, column)), 0);

  const changeCount = changedCellCountOf(changes);
  const message =
    errors.size > 0
      ? `${t(K.changes, { count: changeCount })} · ${t(K.errors, { count: errors.size })}`
      : t(K.changes, { count: changeCount });

  return {
    columns,
    changes,
    changeCount,
    errorCount: errors.size,
    valueOf,
    textOf,
    copyTextOf,
    errorOf,
    isChanged,
    isEditable,
    write,
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    save,
    discard: () => dispatch({ type: "reset" }),
    rowTotalOf,
    columnTotalOf,
    message,
  };
}
