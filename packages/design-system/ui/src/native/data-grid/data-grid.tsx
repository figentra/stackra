/**
 * Stackra file contract:
 * Purpose: the native `DataGrid`, the phone form of the web spreadsheet: a grid of typed cells whose header row stays
 *          in view while the rows scroll and whose pinned columns (the first, by default) stay in view while the other
 *          columns scroll sideways. A header press sorts by its column (ascending, descending, off); a cell press edits
 *          that cell in a sheet and a press on the row's name edits the whole row; Select mode picks rows for a bulk
 *          edit that sets one column on every picked row; the `SaveBar` saves, discards, undoes and redoes. A `matrix`
 *          row shows its total, and a total row closes the grid.
 * Boundary: the columns, sort, selection and density live in the `useCollection` engine (the app's `collection`, or
 *           the grid's own in client mode, the first `frozenColumns` pinned to the start), so a `ColumnEditor` on the
 *           same engine rearranges the grid. The sort orders the saved rows, not the pending edits. Edits are the
 *           web's pending changes (`useDataGridModel`): parsed by `parseGridValue`, checked by `gridCellErrorOf` with
 *           the shared error words, one undo step per Done or Apply, nothing reaching the rows until Save. Pinned
 *           columns sit outside the sideways scroll; the header's middle scroll follows the body's by `scrollTo`, so
 *           it mirrors whatever offsets the platform reports in right-to-left. No cell range, clipboard or fill handle.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid on a phone);
 *          data-collection plan (owner, 2026-10-29); ADR 0060 (RTL); WCAG 2.2 SC 1.3.1, 2.5.8, 3.3.1 and 4.1.2.
 */
import { useContext, useMemo, useRef, useState, type ReactElement } from "react";
import { Pressable, ScrollView, View } from "react-native";

import type { DataGridColumn } from "#contracts/types/data-grid-column.type";
import type { DataGridRow } from "#contracts/types/data-grid-row.type";
import { DATA_GRID_KEYS } from "#core/constants/data-grid-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { collectionColumnOfGrid } from "#core/functions/collection-column-of-grid.function";
import { dataGridColumnWidth } from "#core/functions/data-grid-column-width.function";
import { gridCellErrorOf } from "#core/functions/grid-cell-error-of.function";
import { parseGridValue } from "#core/functions/parse-grid-value.function";
import type { GridCellError } from "#core/types/grid-cell-error.type";
import { useDataGridModel } from "#react/data-grid/use-data-grid-model";
import { useCollection } from "#react/hooks/use-collection";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { Checkbox } from "#native/checkbox/checkbox";
import { DataGridField } from "#native/data-grid/data-grid-field";
import type { DataGridProps } from "#native/data-grid/data-grid.props";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { Drawer } from "#native/drawer/drawer";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import { SaveBar } from "#native/save-bar/save-bar";
import { Select } from "#native/select/select";
import { Text } from "#native/text/text";

/** The grid's words. */
const K = DATA_GRID_KEYS.ui.data_grid;

/** The number column a total is formatted as. */
const TOTAL: DataGridColumn = { id: "total", label: "", type: "number" };

/** The row height of each density, at least the 40-point touch target. */
const ROW_CLASS = Object.freeze({
  compact: "min-h-10",
  normal: "min-h-12",
  roomy: "min-h-14",
} as const);

/** The tallest the grid grows before its rows scroll under the sticky header, in points. */
// shortcut: a fixed height, because the contract's `height` is a CSS length; add a native height prop when an app needs another.
const MAX_HEIGHT = 420;

/** The checkbox column's width in Select mode, in points. */
const PICK_WIDTH = 44;

/** The draft a field starts from. */
function draftOf(value: DataGridRow[string], column: DataGridColumn): string | boolean {
  if (column.type === "boolean") return value === true;
  return value === null || value === undefined ? "" : String(value);
}

/** The value a draft stands for. */
function valueOfDraft(draft: string | boolean, column: DataGridColumn) {
  return typeof draft === "boolean" ? draft : parseGridValue(draft, column);
}

/** What is being edited: a row and the columns of the sheet (one for a cell, every editable one for the row). */
interface Editing {
  readonly row: DataGridRow;
  readonly columnIds: readonly string[];
}

/** The phone form of the DataGrid. */
export function DataGrid<TRow extends DataGridRow = DataGridRow>({
  label,
  columns: given,
  rows,
  onSave,
  onChangesChange,
  isReadOnly,
  variant = "sheet",
  frozenColumns = 1,
  rowHeight: _rowHeight,
  height: _height,
  collection: givenCollection,
  collectionKey,
  density = "normal",
  hasColumnTools: _hasColumnTools,
  className,
  ...rest
}: DataGridProps<TRow>): ReactElement {
  const t = useUiText();
  const locale = useContext(DesignSystemContext)?.locale ?? "en";
  const isMatrix = variant === "matrix";
  const definitions = useMemo(() => given.map(collectionColumnOfGrid), [given]);
  const own = useCollection<TRow>({
    columns: definitions,
    items: rows,
    locale,
    collectionKey,
    initialState: {
      density,
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
        return column ? [{ ...column, label: resolved.label }] : [];
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
  const head = columns[0];
  const shown = engine.rows as readonly TRow[];
  const selected = engine.state.selection;
  const rowClass = ROW_CLASS[engine.state.density];
  const startColumns = columns.filter((column, index) => pinOf(column.id, index) === "start");
  const endColumns = columns.filter((column, index) => pinOf(column.id, index) === "end");
  const middleColumns = columns.filter((column, index) => pinOf(column.id, index) === undefined);
  const headerScroll = useRef<ScrollView>(null);

  const [editing, setEditing] = useState<Editing | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string | boolean>>({});
  const [isSelecting, setSelecting] = useState(false);
  const [isBulkOpen, setBulkOpen] = useState(false);
  const [bulkColumnId, setBulkColumnId] = useState<string | null>(null);
  const [bulkDraft, setBulkDraft] = useState<string | boolean>("");
  const editable = columns.filter((column) => model.isEditable(column));
  const bulkColumn = editable.find((column) => column.id === bulkColumnId) ?? editable[0];
  const sheetColumns = editing
    ? editable.filter((column) => editing.columnIds.includes(column.id))
    : [];
  const nameOf = (row: DataGridRow) =>
    head ? model.textOf(model.valueOf(row, head), head) : row.id;
  const errorText = (error: GridCellError | undefined) =>
    error === undefined
      ? undefined
      : error.kind === "custom"
        ? error.message
        : t(K[error.kind], "limit" in error ? { limit: error.limit } : {});

  const open = (row: DataGridRow, columnIds: readonly string[]) => {
    setDrafts(
      Object.fromEntries(
        columns.map((column) => [column.id, draftOf(model.valueOf(row, column), column)]),
      ),
    );
    setEditing({ row, columnIds });
  };
  const draftRow = (row: DataGridRow): DataGridRow => ({
    ...row,
    ...Object.fromEntries(
      columns.map((column) => [column.id, valueOfDraft(drafts[column.id] ?? "", column)]),
    ),
  });
  const done = () => {
    if (!editing) return;
    model.write(
      sheetColumns.map((column) => ({
        row: editing.row,
        column,
        value: valueOfDraft(drafts[column.id] ?? "", column),
      })),
    );
    setEditing(null);
  };
  const apply = () => {
    if (!bulkColumn) return;
    const value = valueOfDraft(bulkDraft, bulkColumn);
    model.write(
      rows
        .filter((row) => selected.includes(row.id))
        .map((row) => ({ row, column: bulkColumn, value })),
    );
    setBulkOpen(false);
    engine.setSelection([]);
    setSelecting(false);
  };
  const toggle = (id: string) =>
    engine.setSelection(
      selected.includes(id) ? selected.filter((key) => key !== id) : [...selected, id],
    );

  /** A header cell: a press sorts by its column. */
  const headerCell = (column: DataGridColumn) => {
    const direction = engine.state.sort.find((key) => key.column === column.id)?.direction;
    const isEnd = (column.align ?? (column.type === "number" ? "end" : "start")) === "end";
    return (
      <Pressable
        key={column.id}
        accessibilityRole="button"
        accessibilityLabel={`${t(UI_KEYS.ui.table.sort_by)} ${column.label}${direction ? `, ${t(UI_KEYS.ui.table[direction])}` : ""}`}
        accessibilityState={{ selected: direction !== undefined }}
        onPress={() => engine.toggleSort(column.id)}
        style={{ width: dataGridColumnWidth(column) }}
        className={`min-h-11 flex-row items-center gap-1 px-2 ${isEnd ? "justify-end" : ""}`}
      >
        <Text type="small" className="font-medium text-muted" numberOfLines={1}>
          {column.label}
        </Text>
        {direction ? (
          <Icon
            name={direction === "ascending" ? "arrow-up" : "arrow-down"}
            size="sm"
            tone="muted"
          />
        ) : null}
      </Pressable>
    );
  };

  /** A body cell: a press edits it (the name cell edits the row, or picks it in Select mode). */
  const bodyCell = (row: TRow, column: DataGridColumn) => {
    const value = model.valueOf(row, column);
    const text = model.textOf(value, column);
    const error = model.errorOf(row, column);
    const isName = column.id === head?.id;
    const isLatin = column.type === "number" || column.type === "date";
    const isEnd = (column.align ?? (column.type === "number" ? "end" : "start")) === "end";
    const canEdit = !isReadOnly && model.isEditable(column);
    const name = nameOf(row);
    const onPress = isSelecting
      ? () => toggle(row.id)
      : isReadOnly
        ? undefined
        : isName
          ? () =>
              open(
                row,
                editable.map((candidate) => candidate.id),
              )
          : canEdit
            ? () => open(row, [column.id])
            : undefined;
    return (
      <Pressable
        key={column.id}
        accessibilityRole={onPress ? "button" : "text"}
        accessibilityLabel={
          isName && !isSelecting && !isReadOnly
            ? t(K.edit_row, { name })
            : `${column.label}: ${text || "—"}${error ? `, ${error}` : ""}`
        }
        {...(onPress ? { onPress } : { disabled: true })}
        style={{ width: dataGridColumnWidth(column) }}
        className={[
          rowClass,
          "justify-center px-2",
          model.isChanged(row, column) ? "bg-warning-soft" : "",
          isEnd ? "items-end" : "",
        ].join(" ")}
      >
        <Text
          type={isName ? "body" : "small"}
          className={error ? "text-danger" : isName ? "font-medium" : ""}
          numberOfLines={1}
          {...(isLatin ? { style: { writingDirection: "ltr" as const } } : {})}
        >
          {column.type === "boolean" ? (value === true ? "✓" : "—") : text || "—"}
        </Text>
      </Pressable>
    );
  };

  const pickCell = (row: TRow) => {
    const isPicked = selected.includes(row.id);
    return (
      <Pressable
        key="pick"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isPicked }}
        accessibilityLabel={nameOf(row)}
        onPress={() => toggle(row.id)}
        style={{ width: PICK_WIDTH }}
        className={`${rowClass} items-center justify-center`}
      >
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Checkbox label={nameOf(row)} value={isPicked} />
        </View>
      </Pressable>
    );
  };

  const rowLine = "flex-row border-b border-separator";
  const totalOf = (row: DataGridRow) => (
    <View style={{ width: 96 }} className={`${rowClass} items-end justify-center px-2`}>
      <Text className="font-medium" style={{ writingDirection: "ltr" }}>
        {model.textOf(model.rowTotalOf(row), TOTAL)}
      </Text>
    </View>
  );

  return (
    <View {...rest} className={["gap-3", className].filter(Boolean).join(" ")}>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 font-medium" accessibilityRole="header">
          {label}
        </Text>
        {isReadOnly ? null : isSelecting ? (
          <>
            <Button
              size="sm"
              isDisabled={selected.length === 0}
              onPress={() => {
                setBulkColumnId(editable[0]?.id ?? null);
                setBulkDraft(editable[0] ? draftOf(null, editable[0]) : "");
                setBulkOpen(true);
              }}
            >
              {t(K.bulk_edit, { count: selected.length })}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => {
                setSelecting(false);
                engine.setSelection([]);
              }}
            >
              {t(K.cancel)}
            </Button>
          </>
        ) : (
          <Button size="sm" variant="secondary" onPress={() => setSelecting(true)}>
            {t(K.select)}
          </Button>
        )}
      </View>
      <ScrollView
        stickyHeaderIndices={[0]}
        nestedScrollEnabled
        style={{ maxHeight: MAX_HEIGHT }}
        accessibilityLabel={label}
        className="rounded-[var(--radius-container)] border border-separator bg-surface"
      >
        <View className={`${rowLine} bg-surface-secondary`}>
          {isSelecting ? <View style={{ width: PICK_WIDTH }} /> : null}
          {startColumns.map(headerCell)}
          <ScrollView
            ref={headerScroll}
            horizontal
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            className="flex-1"
          >
            {middleColumns.map(headerCell)}
          </ScrollView>
          {endColumns.map(headerCell)}
          {isMatrix ? (
            <View style={{ width: 96 }} className="min-h-11 items-end justify-center px-2">
              <Text type="small" className="font-medium text-muted">
                {t(K.total)}
              </Text>
            </View>
          ) : null}
        </View>
        <View className="flex-row">
          <View>
            {shown.map((row) => (
              <View key={row.id} className={rowLine}>
                {isSelecting ? pickCell(row) : null}
                {startColumns.map((column) => bodyCell(row, column))}
              </View>
            ))}
          </View>
          <ScrollView
            horizontal
            nestedScrollEnabled
            scrollEventThrottle={16}
            onScroll={(event) =>
              headerScroll.current?.scrollTo({
                x: event.nativeEvent.contentOffset.x,
                animated: false,
              })
            }
            className="flex-1"
          >
            <View>
              {shown.map((row) => (
                <View key={row.id} className={rowLine}>
                  {middleColumns.map((column) => bodyCell(row, column))}
                </View>
              ))}
            </View>
          </ScrollView>
          <View>
            {shown.map((row) => (
              <View key={row.id} className={rowLine}>
                {endColumns.map((column) => bodyCell(row, column))}
                {isMatrix ? totalOf(row) : null}
              </View>
            ))}
          </View>
        </View>
        {isMatrix ? (
          <View className="flex-row items-center justify-between px-2 py-2">
            <Text className="font-medium">{t(K.total)}</Text>
            <Text className="font-medium" style={{ writingDirection: "ltr" }}>
              {model.textOf(
                columns.slice(1).reduce((sum, column) => sum + model.columnTotalOf(column), 0),
                TOTAL,
              )}
            </Text>
          </View>
        ) : null}
      </ScrollView>
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
      <Drawer
        isOpen={editing !== null}
        onOpenChange={(isOpen) => (isOpen ? undefined : setEditing(null))}
        label={editing ? t(K.edit_row, { name: nameOf(editing.row) }) : ""}
      >
        <Drawer.Header>
          <Drawer.Title>{editing ? t(K.edit_row, { name: nameOf(editing.row) }) : ""}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <View className="gap-4">
            {editing
              ? sheetColumns.map((column) => (
                  <DataGridField
                    key={column.id}
                    column={column}
                    draft={drafts[column.id] ?? ""}
                    onDraftChange={(draft) => setDrafts({ ...drafts, [column.id]: draft })}
                    errorMessage={errorText(
                      gridCellErrorOf(
                        valueOfDraft(drafts[column.id] ?? "", column),
                        column,
                        draftRow(editing.row),
                      ),
                    )}
                  />
                ))
              : null}
          </View>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="ghost" onPress={() => setEditing(null)}>
            {t(K.cancel)}
          </Button>
          <Button onPress={done}>{t(K.done)}</Button>
        </Drawer.Footer>
      </Drawer>
      <Drawer isOpen={isBulkOpen} onOpenChange={setBulkOpen} label={t(K.bulk_edit_title)}>
        <Drawer.Header>
          <Drawer.Title>{t(K.bulk_edit_title)}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <View className="gap-4">
            <Select
              label={t(K.bulk_column)}
              items={editable.map((column) => ({ id: column.id, label: column.label }))}
              value={bulkColumn?.id ?? null}
              onChange={(id) => {
                const column = editable.find((candidate) => candidate.id === id);
                setBulkColumnId(id);
                if (column) setBulkDraft(draftOf(null, column));
              }}
            />
            {bulkColumn ? (
              <DataGridField
                column={bulkColumn}
                label={t(K.bulk_value)}
                draft={bulkDraft}
                onDraftChange={setBulkDraft}
              />
            ) : null}
          </View>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="ghost" onPress={() => setBulkOpen(false)}>
            {t(K.cancel)}
          </Button>
          <Button onPress={apply}>{t(K.apply)}</Button>
        </Drawer.Footer>
      </Drawer>
    </View>
  );
}
