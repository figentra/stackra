/**
 * Stackra file contract:
 * Purpose: the web `DataGrid`, an Excel-like editor of typed cells: a cell range picked with the pointer or Shift and
 *          the arrows, copy, cut and paste of tab-separated text with Excel, Numbers and Google Sheets, a fill handle
 *          (and Ctrl+D) that repeats the range down or across, typed editors (text, number, select, date, boolean),
 *          validation of edited cells, undo and redo, a `SaveBar` of the pending changes, frozen leading columns and
 *          virtualised rows. The `matrix` variant is a quantity matrix (colour by size) with a total per row and per
 *          column.
 * Boundary: the grid keeps the pending changes (`useDataGridModel`) and never writes the rows. Focus stays on the
 *           grid element and the active cell is its `aria-activedescendant`, so virtualised rows can come and go
 *           without losing focus; the active row is always drawn. Keys follow spreadsheets: arrows (mirrored in
 *           right-to-left), Tab, Home, End, PageUp, PageDown, Enter or F2 to edit, typing to replace, Space to tick a
 *           boolean, Delete to clear, Ctrl+Z, Ctrl+Y or Ctrl+Shift+Z, Ctrl+D, Ctrl+A, Escape. The active cell's error is
 *           shown under the grid and announced politely. Fill repeats the pattern only (no series).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid); ADR 0060 (RTL);
 *          WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.7, 3.3.1, 4.1.2 and 4.1.3.
 */
import { cn } from "@heroui/react";
import { IconRegistryProvider } from "@stackra/icons/react";
import {
  useMemo,
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
} from "react";
import { useLocale } from "react-aria-components";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { DataGridColumn } from "#contracts/types/data-grid-column.type";
import type { DataGridRow } from "#contracts/types/data-grid-row.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { DATA_GRID_KEYS } from "#core/constants/data-grid-keys.constant";
import { fillPatternOf } from "#core/functions/fill-pattern-of.function";
import { parseGridValue } from "#core/functions/parse-grid-value.function";
import { parseTsv } from "#core/functions/parse-tsv.function";
import { toTsv } from "#core/functions/to-tsv.function";
import { DataGridEditor } from "#react/data-grid/data-grid-editor";
import type { DataGridEditorMove } from "#react/data-grid/data-grid-editor-move.type";
import type { DataGridProps } from "#react/data-grid/data-grid.props";
import type { DataGridWrite } from "#react/data-grid/data-grid-write.type";
import type { GridCell } from "#react/data-grid/grid-cell.type";
import { useDataGridModel } from "#react/data-grid/use-data-grid-model";
import { COLLECTION_ICONS } from "#react/data-table/collection-icons.constant";
import { ColumnMenu } from "#react/data-table/column-menu";
import { useCollection } from "#react/hooks/use-collection";
import { useResizeHandle } from "#react/hooks/use-resize-handle";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import { SaveBar } from "#react/save-bar/save-bar";

/** The grid's words. */
const K = DATA_GRID_KEYS.ui.data_grid;

/** Rows drawn above and below the ones in view. */
const OVERSCAN = 6;

/** The row height of each density, in CSS pixels. */
const ROW_HEIGHT = Object.freeze({ compact: 30, normal: 36, roomy: 48 } as const);

/** A grid column as the collection engine sees it. */
function collectionColumnOf(column: DataGridColumn): CollectionColumn {
  return {
    id: column.id,
    label: column.label,
    width: widthOf(column),
    minWidth: 64,
    type: column.type === "number" ? "number" : column.type === "select" ? "choice" : "text",
    ...(column.align ? { align: column.align } : {}),
  };
}

/** The resize strip at the end of a header: a drag, or the arrows, Home and End when it has focus. */
function ResizeStrip({
  label,
  width,
  onResize,
}: {
  readonly label: string;
  readonly width: number;
  readonly onResize: (width: number) => void;
}) {
  const clamp = (next: number) => onResize(Math.round(Math.min(Math.max(next, 64), 640)));
  const handlers = useResizeHandle({
    width,
    minWidth: 64,
    maxWidth: 640,
    edge: "end",
    resizing: "[data-slot=data-grid]",
    onResize: clamp,
  });
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={width}
      aria-valuemin={64}
      aria-valuemax={640}
      tabIndex={0}
      {...handlers}
      // The grid's own keys (arrows walk the cells) stay away while the strip has focus.
      onKeyDown={(event) => {
        event.stopPropagation();
        handlers.onKeyDown(event);
      }}
      className="absolute inset-y-0 -end-1 z-[4] w-2 cursor-col-resize touch-none outline-none after:absolute after:inset-y-1 after:start-1/2 after:w-0.5 after:bg-transparent hover:after:bg-accent focus-visible:after:bg-focus"
    />
  );
}

/** The default width of a column, by kind. */
function widthOf(column: DataGridColumn): number {
  return column.width ?? (column.type === "number" || column.type === "boolean" ? 96 : 160);
}

/** The text alignment class of a column. */
function alignOf(column: DataGridColumn): string {
  const align = column.align ?? (column.type === "number" ? "end" : "start");
  return align === "end" ? "justify-end text-end" : align === "center" ? "justify-center" : "";
}

/** The cells between two corners, as row and column bounds. */
function boundsOf(a: GridCell, b: GridCell) {
  return {
    top: Math.min(a.row, b.row),
    bottom: Math.max(a.row, b.row),
    start: Math.min(a.column, b.column),
    end: Math.max(a.column, b.column),
  };
}

/** The cell under the pointer, read from the data attributes of the cell it is over. */
function cellAt(event: PointerEvent): GridCell | null {
  const element = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-cell]");
  const [row, column] = (element?.getAttribute("data-cell") ?? "").split(":").map(Number);
  return row === undefined || column === undefined || Number.isNaN(row) || Number.isNaN(column)
    ? null
    : { row, column };
}

/** The spreadsheet-like editor of typed cells. */
export function DataGrid<TRow extends DataGridRow = DataGridRow>({
  label,
  columns: given,
  rows,
  onSave,
  onChangesChange,
  isReadOnly,
  variant = "sheet",
  frozenColumns = 1,
  rowHeight: givenRowHeight,
  height = "24rem",
  collection: givenCollection,
  collectionKey,
  density = "normal",
  hasColumnTools = false,
  className,
  ...rest
}: DataGridProps<TRow>): ReactElement {
  const t = useUiText();
  const { locale, direction } = useLocale();
  const isMatrix = variant === "matrix";
  const rowHeight = givenRowHeight ?? ROW_HEIGHT[density];
  // The columns as the engine arranges them (the app's, or the grid's own with the first `frozenColumns` pinned).
  const definitions = useMemo(() => given.map(collectionColumnOf), [given]);
  const own = useCollection<TRow>({
    columns: definitions,
    items: rows,
    mode: "server",
    locale,
    collectionKey,
    initialState: {
      columns: given.map((column, index) => ({
        id: column.id,
        ...(index < frozenColumns ? { pin: "start" as const } : {}),
      })),
    },
  });
  const engine = givenCollection ?? own;
  // A matrix keeps its defined order: its first column names the rows and its totals follow it.
  const arranged: readonly DataGridColumn[] = isMatrix
    ? given
    : engine.visibleColumns.flatMap((resolved) => {
        const column = given.find((candidate) => candidate.id === resolved.id);
        return column
          ? [{ ...column, label: resolved.label, width: resolved.width ?? widthOf(column) }]
          : [];
      });
  const pinOf = (id: string, index: number) =>
    isMatrix
      ? index < frozenColumns
        ? "start"
        : undefined
      : engine.columns.find((column) => column.id === id)?.pin;
  const model = useDataGridModel(
    { rows, columns: arranged, variant, isReadOnly, onSave, onChangesChange },
    locale,
  );
  const { columns } = model;
  const id = useId();
  const grid = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<GridCell>({ row: 0, column: 0 });
  const [anchor, setAnchor] = useState<GridCell>({ row: 0, column: 0 });
  const [draft, setDraft] = useState<string | null>(null);
  const [fill, setFill] = useState<GridCell | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(480);
  useEffect(() => {
    const element = grid.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setViewport(element.clientHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const dragging = useRef<"range" | "fill" | null>(null);

  const lastRow = rows.length - 1;
  const lastColumn = columns.length - 1;
  const range = boundsOf(anchor, active);
  const widths = columns.map(widthOf);
  const template = [...widths, ...(isMatrix ? [96] : [])].map((width) => `${width}px`).join(" ");
  const offsets = widths.map((_, index) =>
    widths.slice(0, index).reduce((sum, width) => sum + width, 0),
  );
  const cellId = (cell: GridCell) => `${id}-${cell.row}-${cell.column}`;

  // Virtualisation: the rows in view plus an overscan, and always the active row so the active descendant exists.
  const first = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  const last = Math.min(lastRow, Math.ceil((scrollTop + viewport) / rowHeight) + OVERSCAN);
  const drawn = new Set<number>();
  for (let index = first; index <= last; index += 1) drawn.add(index);
  if (rows.length > 0) drawn.add(active.row);

  const rowOf = (index: number) => rows[index] as DataGridRow;
  const columnOf = (index: number) => columns[index] as DataGridColumn;

  const scrollIntoView = (cell: GridCell) => {
    const element = grid.current;
    if (!element) return;
    const top = cell.row * rowHeight;
    const header = rowHeight;
    if (top < element.scrollTop) element.scrollTop = top;
    else if (top + rowHeight + header > element.scrollTop + element.clientHeight)
      element.scrollTop = top + rowHeight + header - element.clientHeight;
  };
  const moveTo = (cell: GridCell, isExtending = false) => {
    const next = {
      row: Math.min(Math.max(cell.row, 0), Math.max(lastRow, 0)),
      column: Math.min(Math.max(cell.column, 0), lastColumn),
    };
    setActive(next);
    if (!isExtending) setAnchor(next);
    scrollIntoView(next);
  };

  /** The values of the range, one array per row. */
  const blockOf = (bounds: ReturnType<typeof boundsOf>) =>
    Array.from({ length: bounds.bottom - bounds.top + 1 }, (_, row) =>
      Array.from({ length: bounds.end - bounds.start + 1 }, (_cell, column) =>
        model.valueOf(rowOf(bounds.top + row), columnOf(bounds.start + column)),
      ),
    );
  const writeBlock = (
    top: number,
    start: number,
    values: readonly (readonly DataGridWrite["value"][])[],
  ) => {
    const writes: DataGridWrite[] = [];
    values.forEach((line, row) =>
      line.forEach((value, column) => {
        const target = rows[top + row];
        const where = columns[start + column];
        if (target && where) writes.push({ row: target, column: where, value });
      }),
    );
    model.write(writes);
  };
  const clearRange = () =>
    writeBlock(
      range.top,
      range.start,
      Array.from({ length: range.bottom - range.top + 1 }, () =>
        Array.from({ length: range.end - range.start + 1 }, (_, column) =>
          columnOf(range.start + column).type === "boolean" ? false : null,
        ),
      ),
    );

  const startEditing = (text?: string) => {
    const column = columnOf(active.column);
    if (!model.isEditable(column) || rows.length === 0) return;
    if (column.type === "boolean") {
      model.write([
        {
          row: rowOf(active.row),
          column,
          value: model.valueOf(rowOf(active.row), column) !== true,
        },
      ]);
      return;
    }
    const value = model.valueOf(rowOf(active.row), column);
    setDraft(
      text ?? (column.type === "select" ? String(value ?? "") : model.copyTextOf(value, column)),
    );
  };
  const commit = (move: DataGridEditorMove, chosen?: string) => {
    const column = columnOf(active.column);
    const text = chosen ?? draft ?? "";
    model.write([{ row: rowOf(active.row), column, value: parseGridValue(text, column) }]);
    setDraft(null);
    grid.current?.focus({ preventScroll: true });
    const step = { down: [1, 0], up: [-1, 0], next: [0, 1], previous: [0, -1], stay: [0, 0] }[move];
    moveTo({ row: active.row + (step[0] ?? 0), column: active.column + (step[1] ?? 0) });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Keys pressed in a header's menu or resize strip are theirs, not the grid's.
    if (draft !== null || rows.length === 0 || event.target !== event.currentTarget) return;
    const isCommand = event.ctrlKey || event.metaKey;
    const key = event.key;
    const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    const back = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
    const page = Math.max(1, Math.floor(viewport / rowHeight) - 1);
    const go = (cell: GridCell) => {
      event.preventDefault();
      moveTo(cell, event.shiftKey);
    };
    if (isCommand && key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) model.redo();
      else model.undo();
    } else if (isCommand && key.toLowerCase() === "y") {
      event.preventDefault();
      model.redo();
    } else if (isCommand && key.toLowerCase() === "a") {
      event.preventDefault();
      setAnchor({ row: 0, column: 0 });
      setActive({ row: lastRow, column: lastColumn });
    } else if (isCommand && key.toLowerCase() === "d") {
      event.preventDefault();
      writeBlock(
        range.top,
        range.start,
        fillPatternOf(
          blockOf({ ...range, bottom: range.top }),
          range.bottom - range.top + 1,
          range.end - range.start + 1,
        ),
      );
    } else if (key === "ArrowDown")
      go({ row: isCommand ? lastRow : active.row + 1, column: active.column });
    else if (key === "ArrowUp") go({ row: isCommand ? 0 : active.row - 1, column: active.column });
    else if (key === forward)
      go({ row: active.row, column: isCommand ? lastColumn : active.column + 1 });
    else if (key === back) go({ row: active.row, column: isCommand ? 0 : active.column - 1 });
    else if (key === "Home") go({ row: isCommand ? 0 : active.row, column: 0 });
    else if (key === "End") go({ row: isCommand ? lastRow : active.row, column: lastColumn });
    else if (key === "PageDown") go({ row: active.row + page, column: active.column });
    else if (key === "PageUp") go({ row: active.row - page, column: active.column });
    else if (key === "Tab") {
      // Tab walks the cells and leaves the grid at either end, so it is never a trap.
      const next = active.column + (event.shiftKey ? -1 : 1);
      if (next < 0 || next > lastColumn) return;
      event.preventDefault();
      moveTo({ row: active.row, column: next });
    } else if (key === "Enter" || key === "F2") {
      event.preventDefault();
      startEditing();
    } else if (key === " " && columnOf(active.column).type === "boolean") {
      event.preventDefault();
      const column = columnOf(active.column);
      const next = model.valueOf(rowOf(active.row), column) !== true;
      writeBlock(
        range.top,
        range.start,
        Array.from({ length: range.bottom - range.top + 1 }, () =>
          Array.from({ length: range.end - range.start + 1 }, () => next),
        ),
      );
    } else if (key === "Delete" || key === "Backspace") {
      event.preventDefault();
      clearRange();
    } else if (key === "Escape") setAnchor(active);
    else if (key.length === 1 && !isCommand && !event.altKey) {
      // Typing in a cell replaces its value, as in a spreadsheet.
      event.preventDefault();
      startEditing(key);
    }
  };

  const onCopy = (event: ClipboardEvent<HTMLDivElement>) => {
    if (rows.length === 0) return;
    event.preventDefault();
    const text = blockOf(range).map((line, row) =>
      line.map((value, column) =>
        model.copyTextOf(value, columnOf(range.start + column) ?? columnOf(row)),
      ),
    );
    event.clipboardData.setData("text/plain", toTsv(text));
  };
  const onCut = (event: ClipboardEvent<HTMLDivElement>) => {
    onCopy(event);
    clearRange();
  };
  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    if (rows.length === 0) return;
    event.preventDefault();
    const cells = parseTsv(event.clipboardData.getData("text/plain"));
    const tall = Math.max(cells.length, range.bottom - range.top + 1);
    const width = Math.max(...cells.map((line) => line.length), range.end - range.start + 1);
    // A block smaller than the range is repeated over it, as a spreadsheet does.
    const texts = fillPatternOf(cells, tall, width);
    writeBlock(
      range.top,
      range.start,
      texts.map((line, row) =>
        line.map((text, column) => {
          const where = columns[range.start + column];
          return where && rows[range.top + row] ? parseGridValue(String(text ?? ""), where) : null;
        }),
      ),
    );
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging.current) return;
    const cell = cellAt(event);
    if (!cell) return;
    if (dragging.current === "range") setActive(cell);
    else setFill(cell);
  };
  const onPointerUp = () => {
    if (dragging.current === "fill" && fill) {
      // The fill runs along the axis the pointer moved furthest.
      const down = fill.row - range.bottom;
      const across = Math.abs(fill.column - (fill.column < range.start ? range.start : range.end));
      const source = blockOf(range);
      if (down > 0 && down >= across)
        writeBlock(
          range.bottom + 1,
          range.start,
          fillPatternOf(source, down, range.end - range.start + 1),
        );
      else if (fill.column > range.end)
        writeBlock(
          range.top,
          range.end + 1,
          fillPatternOf(source, range.bottom - range.top + 1, fill.column - range.end),
        );
    }
    dragging.current = null;
    setFill(null);
  };

  const activeError =
    rows.length > 0 ? model.errorOf(rowOf(active.row), columnOf(active.column)) : undefined;
  // Pinned columns stick at the sum of the pinned widths before them (start) or after them (end).
  const endOffsets = widths.map((_, index) =>
    widths.slice(index + 1).reduce((sum, width, after) => {
      const next = columns[index + 1 + after];
      return next && pinOf(next.id, index + 1 + after) === "end" ? sum + width : sum;
    }, 0),
  );
  const sticky = (index: number): CSSProperties => {
    const column = columns[index];
    const pin = column ? pinOf(column.id, index) : undefined;
    if (pin === "start") return { position: "sticky", insetInlineStart: offsets[index], zIndex: 2 };
    if (pin === "end") return { position: "sticky", insetInlineEnd: endOffsets[index], zIndex: 2 };
    return {};
  };
  const [dragged, setDragged] = useState<string | null>(null);
  const fillBounds = fill
    ? boundsOf(
        { row: range.top, column: range.start },
        { row: Math.max(fill.row, range.bottom), column: Math.max(fill.column, range.end) },
      )
    : null;

  const cellClass =
    "flex h-full items-center overflow-hidden border-e border-b border-separator px-2 text-sm";
  const header = (
    <div
      role="row"
      aria-rowindex={1}
      className="sticky top-0 z-10 grid bg-surface-secondary font-medium"
      style={{ gridTemplateColumns: template, height: rowHeight }}
    >
      {columns.map((column, index) => {
        const resolved = engine.columns.find((entry) => entry.id === column.id);
        const hasTools = hasColumnTools && !isMatrix && resolved !== undefined;
        return (
          <div
            key={column.id}
            role="columnheader"
            aria-colindex={index + 1}
            className={cn(
              cellClass,
              alignOf(column),
              "relative gap-1 bg-surface-secondary",
              dragged === column.id && "opacity-50",
            )}
            style={sticky(index)}
            {...(hasTools
              ? {
                  draggable: true,
                  onDragStart: (event: DragEvent<HTMLDivElement>) => {
                    // oxlint-disable-next-line no-param-reassign -- the drag-and-drop contract is to set effectAllowed on the event
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", column.label);
                    setDragged(column.id);
                  },
                  onDragEnd: () => setDragged(null),
                  onDragOver: (event: DragEvent<HTMLDivElement>) => {
                    if (dragged !== null && dragged !== column.id) event.preventDefault();
                  },
                  onDrop: (event: DragEvent<HTMLDivElement>) => {
                    event.preventDefault();
                    if (dragged === null || dragged === column.id) return;
                    const box = event.currentTarget.getBoundingClientRect();
                    const isStartHalf =
                      event.clientX < box.left + box.width / 2 === (direction !== "rtl");
                    const order = engine.columns
                      .map((entry) => entry.id)
                      .filter((entryId) => entryId !== dragged);
                    engine.moveColumn(dragged, order.indexOf(column.id) + (isStartHalf ? 0 : 1));
                    setDragged(null);
                  },
                }
              : {})}
          >
            <span className="min-w-0 flex-1 truncate">{column.label}</span>
            {hasTools ? <ColumnMenu column={resolved} collection={engine} /> : null}
            {hasTools ? (
              <ResizeStrip
                label={t(COLLECTION_KEYS.ui.collection.resize_handle, { label: column.label })}
                width={widthOf(column)}
                onResize={(width) => engine.updateColumn(column.id, { width })}
              />
            ) : null}
          </div>
        );
      })}
      {isMatrix ? (
        <div
          role="columnheader"
          aria-colindex={columns.length + 1}
          className={cn(cellClass, "justify-end bg-surface-secondary")}
        >
          {t(K.total)}
        </div>
      ) : null}
    </div>
  );

  return (
    <IconRegistryProvider registry={COLLECTION_ICONS}>
      <div
        {...rest}
        data-slot="data-grid"
        className={cn("grid min-w-0 gap-2", className)}
        style={{ minInlineSize: "min(36rem, calc(100vw - 6rem))", ...rest.style }}
      >
        <div
          ref={grid}
          role="grid"
          aria-label={label}
          aria-rowcount={rows.length + 1 + (isMatrix ? 1 : 0)}
          aria-colcount={columns.length + (isMatrix ? 1 : 0)}
          aria-multiselectable
          aria-readonly={isReadOnly || undefined}
          aria-activedescendant={draft === null && rows.length > 0 ? cellId(active) : undefined}
          tabIndex={0}
          className="relative overflow-auto rounded-[var(--radius-control)] border border-separator bg-background outline-none select-none focus-visible:ring-2 focus-visible:ring-focus"
          style={{ maxHeight: height }}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          onKeyDown={onKeyDown}
          onCopy={onCopy}
          onCut={onCut}
          onPaste={onPaste}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div style={{ width: "max-content", minWidth: "100%" }}>
            {header}
            <div role="rowgroup" className="relative" style={{ height: rows.length * rowHeight }}>
              {[...drawn].map((rowIndex) => {
                const row = rowOf(rowIndex);
                return (
                  <div
                    key={row.id}
                    role="row"
                    aria-rowindex={rowIndex + 2}
                    className="absolute inset-x-0 grid"
                    style={{
                      gridTemplateColumns: template,
                      height: rowHeight,
                      top: rowIndex * rowHeight,
                    }}
                  >
                    {columns.map((column, columnIndex) => {
                      const value = model.valueOf(row, column);
                      const isActive = active.row === rowIndex && active.column === columnIndex;
                      const isInRange =
                        rowIndex >= range.top &&
                        rowIndex <= range.bottom &&
                        columnIndex >= range.start &&
                        columnIndex <= range.end;
                      const isFilling =
                        fillBounds !== null &&
                        rowIndex >= fillBounds.top &&
                        rowIndex <= fillBounds.bottom &&
                        columnIndex >= fillBounds.start &&
                        columnIndex <= fillBounds.end &&
                        !isInRange;
                      const error = model.errorOf(row, column);
                      const isRangeCorner = rowIndex === range.bottom && columnIndex === range.end;
                      return (
                        <div
                          key={column.id}
                          id={cellId({ row: rowIndex, column: columnIndex })}
                          role={columnIndex === 0 ? "rowheader" : "gridcell"}
                          aria-colindex={columnIndex + 1}
                          aria-selected={isInRange}
                          aria-invalid={error ? true : undefined}
                          aria-readonly={model.isEditable(column) ? undefined : true}
                          data-cell={`${rowIndex}:${columnIndex}`}
                          className={cn(
                            cellClass,
                            "relative bg-background",
                            alignOf(column),
                            !model.isEditable(column) && "text-muted",
                            model.isChanged(row, column) && "bg-warning-soft",
                            isInRange && "bg-accent-soft",
                            isFilling && "bg-accent-soft/50",
                            error && "outline-2 -outline-offset-2 outline-danger",
                            isActive && "outline-2 -outline-offset-2 outline-accent",
                          )}
                          style={sticky(columnIndex)}
                          onPointerDown={(event) => {
                            if (
                              event.button !== 0 ||
                              (event.target as HTMLElement).closest("[data-fill-handle]")
                            )
                              return;
                            if (draft !== null) commit("stay");
                            moveTo({ row: rowIndex, column: columnIndex }, event.shiftKey);
                            dragging.current = "range";
                            grid.current?.focus({ preventScroll: true });
                          }}
                          onDoubleClick={() => startEditing()}
                        >
                          {isActive && draft !== null ? (
                            <DataGridEditor
                              column={column}
                              draft={draft}
                              onDraftChange={setDraft}
                              onCommit={commit}
                              onCancel={() => {
                                setDraft(null);
                                grid.current?.focus({ preventScroll: true });
                              }}
                              label={`${column.label}, ${model.textOf(model.valueOf(row, columnOf(0)), columnOf(0))}`}
                            />
                          ) : column.type === "boolean" ? (
                            <span className="inline-flex size-4 items-center justify-center rounded-[var(--radius-control-inner)] border border-default">
                              {value === true ? <Icon name="check" size="sm" /> : null}
                              <span className="sr-only">
                                {model.textOf(value === true, column)}
                              </span>
                            </span>
                          ) : (
                            <span
                              className="truncate"
                              dir={column.type === "number" ? "ltr" : "auto"}
                            >
                              {model.textOf(value, column)}
                            </span>
                          )}
                          {isRangeCorner && !isReadOnly && draft === null ? (
                            <span
                              data-fill-handle
                              aria-hidden
                              title={t(K.fill_handle)}
                              className="absolute -end-1 -bottom-1 z-[3] size-2.5 cursor-crosshair rounded-[var(--radius-control-inner)] border border-background bg-accent"
                              onPointerDown={(event) => {
                                event.stopPropagation();
                                dragging.current = "fill";
                              }}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                    {isMatrix ? (
                      <div
                        role="gridcell"
                        aria-colindex={columns.length + 1}
                        // oxlint-disable-next-line jsx-a11y/role-supports-aria-props -- reason: ARIA 1.2 allows aria-readonly on a gridcell; the total is not editable
                        aria-readonly
                        className={cn(cellClass, "justify-end bg-surface-secondary font-medium")}
                      >
                        <span dir="ltr">
                          {model.textOf(model.rowTotalOf(row), {
                            id: "total",
                            label: "",
                            type: "number",
                          })}
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {isMatrix ? (
              <div
                role="row"
                aria-rowindex={rows.length + 2}
                className="sticky bottom-0 z-10 grid bg-surface-secondary font-medium"
                style={{ gridTemplateColumns: template, height: rowHeight }}
              >
                {columns.map((column, index) => (
                  <div
                    key={column.id}
                    role={index === 0 ? "rowheader" : "gridcell"}
                    aria-colindex={index + 1}
                    aria-readonly
                    className={cn(
                      cellClass,
                      index === 0 ? "" : "justify-end",
                      "bg-surface-secondary",
                    )}
                    style={sticky(index)}
                  >
                    {index === 0 ? (
                      t(K.total)
                    ) : (
                      <span dir="ltr">{model.textOf(model.columnTotalOf(column), column)}</span>
                    )}
                  </div>
                ))}
                <div
                  role="gridcell"
                  aria-colindex={columns.length + 1}
                  // oxlint-disable-next-line jsx-a11y/role-supports-aria-props -- reason: ARIA 1.2 allows aria-readonly on a gridcell; the total is not editable
                  aria-readonly
                  className={cn(cellClass, "justify-end bg-surface-secondary")}
                >
                  <span dir="ltr">
                    {model.textOf(
                      columns
                        .slice(1)
                        .reduce((sum, column) => sum + model.columnTotalOf(column), 0),
                      { id: "total", label: "", type: "number" },
                    )}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <p role="status" aria-live="polite" className="min-h-5 text-sm text-danger">
          {activeError ?? ""}
        </p>
        {isReadOnly ? null : (
          <SaveBar
            isDirty={model.changeCount > 0}
            message={model.message}
            onSave={model.save}
            onDiscard={model.discard}
            isSaveDisabled={model.errorCount > 0}
          >
            <IconButton
              icon="undo-2"
              label={t(K.undo)}
              size="sm"
              variant="ghost"
              isDisabled={!model.canUndo}
              onPress={model.undo}
            />
            <IconButton
              icon="redo-2"
              label={t(K.redo)}
              size="sm"
              variant="ghost"
              isDisabled={!model.canRedo}
              onPress={model.redo}
            />
          </SaveBar>
        )}
      </div>
    </IconRegistryProvider>
  );
}
