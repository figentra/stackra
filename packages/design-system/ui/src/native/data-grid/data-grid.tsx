/**
 * Stackra file contract:
 * Purpose: the native `DataGrid`, the phone form of the web spreadsheet: a virtualised list of rows (the first column
 *          names a row, the others are summed up under it, edited and invalid rows marked), a quick-edit sheet with a
 *          field per column on a row's press, a Select mode with a bulk edit that sets one column on every selected
 *          row, and the `SaveBar` with undo and redo. A `matrix` row shows its total, and a total row closes the list.
 * Boundary: the same pending changes as on web (`useDataGridModel`): Done and Apply write one undo step each; nothing
 *           reaches the rows until Save. There is no cell range, clipboard or fill handle on a phone.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid on a phone);
 *          WCAG 2.2 SC 2.5.8, 3.3.1 and 4.1.2.
 */
import { useContext, useState, type ReactElement } from "react";
import { FlatList, Pressable, View } from "react-native";

import type { DataGridColumn } from "#contracts/types/data-grid-column.type";
import type { DataGridRow } from "#contracts/types/data-grid-row.type";
import { DATA_GRID_KEYS } from "#core/constants/data-grid-keys.constant";
import { gridCellErrorOf } from "#core/functions/grid-cell-error-of.function";
import { parseGridValue } from "#core/functions/parse-grid-value.function";
import { useDataGridModel } from "#react/data-grid/use-data-grid-model";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { Checkbox } from "#native/checkbox/checkbox";
import { DataGridField } from "#native/data-grid/data-grid-field";
import type { DataGridProps } from "#native/data-grid/data-grid.props";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { Drawer } from "#native/drawer/drawer";
import { IconButton } from "#native/icon-button/icon-button";
import { SaveBar } from "#native/save-bar/save-bar";
import { Select } from "#native/select/select";
import { Text } from "#native/text/text";

/** The grid's words. */
const K = DATA_GRID_KEYS.ui.data_grid;

/** The number column a total is formatted as. */
const TOTAL: DataGridColumn = { id: "total", label: "", type: "number" };

/** The draft a field starts from. */
function draftOf(value: DataGridRow[string], column: DataGridColumn): string | boolean {
  if (column.type === "boolean") return value === true;
  return value === null || value === undefined ? "" : String(value);
}

/** The value a draft stands for. */
function valueOfDraft(draft: string | boolean, column: DataGridColumn) {
  return typeof draft === "boolean" ? draft : parseGridValue(draft, column);
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
  frozenColumns: _frozen,
  rowHeight: _rowHeight,
  height: _height,
  className,
  ...rest
}: DataGridProps<TRow>): ReactElement {
  const t = useUiText();
  const locale = useContext(DesignSystemContext)?.locale ?? "en";
  const model = useDataGridModel(
    { rows, columns: given, variant, isReadOnly, onSave, onChangesChange },
    locale,
  );
  const { columns } = model;
  const [head, ...valueColumns] = columns;
  const isMatrix = variant === "matrix";
  const [editing, setEditing] = useState<DataGridRow | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string | boolean>>({});
  const [isSelecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [isBulkOpen, setBulkOpen] = useState(false);
  const [bulkColumnId, setBulkColumnId] = useState<string | null>(null);
  const [bulkDraft, setBulkDraft] = useState<string | boolean>("");
  const editable = columns.filter((column) => model.isEditable(column));
  const bulkColumn = editable.find((column) => column.id === bulkColumnId) ?? editable[0];
  const nameOf = (row: DataGridRow) =>
    head ? model.textOf(model.valueOf(row, head), head) : row.id;

  const openRow = (row: DataGridRow) => {
    setDrafts(
      Object.fromEntries(
        columns.map((column) => [column.id, draftOf(model.valueOf(row, column), column)]),
      ),
    );
    setEditing(row);
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
      editable.map((column) => ({
        row: editing,
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
    setSelected([]);
    setSelecting(false);
  };

  const summaryOf = (row: DataGridRow) =>
    valueColumns
      .map(
        (column) => `${column.label}: ${model.textOf(model.valueOf(row, column), column) || "—"}`,
      )
      .join(" · ");

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
                setSelected([]);
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
      <FlatList
        data={rows}
        keyExtractor={(row) => row.id}
        scrollEnabled={false}
        accessibilityLabel={label}
        renderItem={({ item: row }) => {
          const name = nameOf(row);
          const isChanged = columns.some((column) => model.isChanged(row, column));
          const hasError = columns.some((column) => model.errorOf(row, column) !== undefined);
          const isPicked = selected.includes(row.id);
          return (
            <Pressable
              accessibilityRole={isSelecting ? "checkbox" : "button"}
              accessibilityState={isSelecting ? { checked: isPicked } : {}}
              accessibilityLabel={isSelecting ? name : t(K.edit_row, { name })}
              accessibilityHint={summaryOf(row)}
              onPress={() =>
                isSelecting
                  ? setSelected(
                      isPicked ? selected.filter((id) => id !== row.id) : [...selected, row.id],
                    )
                  : isReadOnly
                    ? undefined
                    : openRow(row)
              }
              className={[
                "min-h-12 flex-row items-center gap-3 border-b border-separator px-1 py-2",
                isChanged ? "bg-warning-soft" : "",
              ].join(" ")}
            >
              {isSelecting ? (
                <View pointerEvents="none">
                  <Checkbox label={name} value={isPicked} />
                </View>
              ) : null}
              <View className="flex-1 gap-0.5">
                <Text className="font-medium">{name}</Text>
                <Text
                  type="small"
                  className={hasError ? "text-danger" : "text-muted"}
                  numberOfLines={2}
                >
                  {summaryOf(row)}
                </Text>
              </View>
              {isMatrix ? (
                <Text className="font-medium" style={{ writingDirection: "ltr" }}>
                  {model.textOf(model.rowTotalOf(row), TOTAL)}
                </Text>
              ) : null}
            </Pressable>
          );
        }}
        ListFooterComponent={
          isMatrix ? (
            <View className="flex-row items-center justify-between px-1 py-2">
              <Text className="font-medium">{t(K.total)}</Text>
              <Text className="font-medium" style={{ writingDirection: "ltr" }}>
                {model.textOf(
                  valueColumns.reduce((sum, column) => sum + model.columnTotalOf(column), 0),
                  TOTAL,
                )}
              </Text>
            </View>
          ) : null
        }
      />
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
        label={editing ? t(K.edit_row, { name: nameOf(editing) }) : ""}
      >
        <Drawer.Header>
          <Drawer.Title>{editing ? t(K.edit_row, { name: nameOf(editing) }) : ""}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <View className="gap-4">
            {editing
              ? editable.map((column) => {
                  const error = gridCellErrorOf(
                    valueOfDraft(drafts[column.id] ?? "", column),
                    column,
                    draftRow(editing),
                  );
                  return (
                    <DataGridField
                      key={column.id}
                      column={column}
                      draft={drafts[column.id] ?? ""}
                      onDraftChange={(draft) => setDrafts({ ...drafts, [column.id]: draft })}
                      errorMessage={
                        error
                          ? error.kind === "custom"
                            ? error.message
                            : t(K[error.kind], "limit" in error ? { limit: error.limit } : {})
                          : undefined
                      }
                    />
                  );
                })
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
