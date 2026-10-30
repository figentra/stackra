/**
 * Stackra file contract:
 * Purpose: the native `ColumnEditor`, the column chooser of the collection family on a phone: a "Columns" button that
 *          opens a bottom sheet with the row density, then every column in a `SortableList` (dragged by its grip, or
 *          moved by the screen reader's "Move up" and "Move down" actions), each ticked to show or hide it and opened
 *          by its pencil to rename it or pin it to the start or end; "Reset columns" puts them all back as defined.
 * Boundary: every change goes to the `useCollection` engine it is given, so a DataGrid, DataTable or DataView on the
 *           same engine follows at once. The row header cannot be hidden. Width and wrap stay web-only (a phone grid
 *           sizes its columns by kind). Reordering follows the engine: pinned columns keep their edge.
 * Runtime: react-native
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3, adapted forms); STA-1371;
 *          WCAG 2.2 SC 1.3.1, 2.5.7 and 4.1.2.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import type { CollectionDensity } from "#contracts/enums/collection-density.enum";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { useColumnEditorState } from "#react/hooks/use-column-editor-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { Checkbox } from "#native/checkbox/checkbox";
import type { ColumnEditorProps } from "#native/column-chooser/column-editor.props";
import { Drawer } from "#native/drawer/drawer";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import { SegmentedControl } from "#native/segmented-control/segmented-control";
import { SortableList } from "#native/sortable-list/sortable-list";
import { TextField } from "#native/text-field/text-field";

/** The words. */
const K = COLLECTION_KEYS.ui.collection;

/** The densities, tightest first. */
const DENSITIES: readonly CollectionDensity[] = ["compact", "normal", "roomy"];

/** Arranges the columns of a collection in a bottom sheet: order, visibility, name, pin and density. */
export function ColumnEditor<TItem extends CollectionItem = CollectionItem>({
  collection,
  label,
  isIconOnly = false,
}: ColumnEditorProps<TItem>): ReactElement {
  const t = useUiText();
  const { name, open, setOpenId, toggle, setShown, rename, pinItems, setPin } =
    useColumnEditorState(collection, label);
  const { columns } = collection;

  return (
    <Drawer
      label={t(K.editor_title)}
      snapPoints={["60%", "90%"]}
      trigger={
        isIconOnly ? (
          <IconButton icon="columns-3" label={name} variant="secondary" size="sm" />
        ) : (
          <Button variant="secondary" size="sm" startIcon="columns-3">
            {name}
          </Button>
        )
      }
    >
      <Drawer.Header>
        <Drawer.Title>{t(K.editor_title)}</Drawer.Title>
        <Drawer.Description>{t(K.editor_hint)}</Drawer.Description>
      </Drawer.Header>
      <Drawer.Body>
        <View className="gap-4">
          <SegmentedControl
            label={t(K.density)}
            size="sm"
            isFullWidth
            selectedKey={collection.state.density}
            onSelectionChange={(key) => collection.setDensity(key as CollectionDensity)}
            items={DENSITIES.map((density) => ({ id: density, label: t(K[`density_${density}`]) }))}
          />
          <SortableList
            label={name}
            items={columns.map((column) => ({ id: column.id, label: column.label }))}
            onReorder={(items) => collection.reorderColumns(items.map((item) => item.id))}
            // A row is one element to a screen reader, so its checkbox and pencil are offered as its actions too.
            accessibilityActionsOf={(item) => {
              const column = columns.find((candidate) => candidate.id === item.id);
              if (!column) return [];
              return [
                ...(column.canHide
                  ? [
                      {
                        name: "toggle_visibility",
                        label: t(column.isHidden ? K.show_column : K.hide_column, {
                          label: column.label,
                        }),
                        onAction: () => setShown(column.id, column.isHidden === true),
                      },
                    ]
                  : []),
                {
                  name: "edit_column",
                  label: t(K.rename_column, { label: column.label }),
                  onAction: () => setOpenId(column.id),
                },
              ];
            }}
            renderItem={(item) => {
              const column = columns.find((candidate) => candidate.id === item.id);
              if (!column) return null;
              return (
                <View className="flex-row items-center gap-2">
                  {/* The box's row is full width, so it takes the room left beside the pin and the pencil, and its
                      visible label is the column's name (said as "Show <name>"), not a second line of text. */}
                  <Checkbox
                    className="min-w-0 flex-1"
                    label={column.label}
                    accessibilityLabel={t(K.show_column, { label: column.label })}
                    value={!column.isHidden}
                    isDisabled={!column.canHide}
                    onChange={(isShown) => setShown(column.id, isShown)}
                  />
                  {column.pin ? (
                    <Icon
                      name="pin"
                      size="sm"
                      tone="muted"
                      label={t(column.pin === "start" ? K.pin_start : K.pin_end)}
                    />
                  ) : null}
                  <IconButton
                    icon="pencil"
                    size="sm"
                    variant="ghost"
                    label={t(K.rename_column, { label: column.label })}
                    onPress={() => toggle(column.id)}
                  />
                </View>
              );
            }}
          />
          {open ? (
            <View
              className="gap-3 rounded-[var(--radius-container)] border border-separator p-3"
              accessibilityLabel={open.label}
            >
              <TextField
                label={t(K.column_name)}
                value={open.label === open.defaultLabel ? "" : open.label}
                placeholder={open.defaultLabel}
                onChange={rename}
              />
              <SegmentedControl
                label={t(K.pin)}
                size="sm"
                isFullWidth
                selectedKey={open.pin ?? "none"}
                onSelectionChange={setPin}
                items={pinItems}
              />
            </View>
          ) : null}
        </View>
      </Drawer.Body>
      <Drawer.Footer>
        <Button variant="ghost" size="sm" startIcon="rotate-ccw" onPress={collection.resetColumns}>
          {t(K.reset_columns)}
        </Button>
      </Drawer.Footer>
    </Drawer>
  );
}
