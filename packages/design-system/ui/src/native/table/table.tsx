/**
 * Stackra file contract:
 * Purpose: the native `Table`, the adapted form of ADR 0302 (decision 3) and ADR 0313 (decision 7): HeroUI Native has
 *          no table, so it is a React Native `FlatList` with one card per row on the web table's contract (`items`,
 *          `columns`, `renderCell`, `selectionMode`, the selected ids, the controlled sort, `emptyState`, `isLoading`,
 *          `hasMore`, `onLoadMore`). A row shows its row-header cell as a title and every other cell as a labelled line;
 *          the sort is a chooser of buttons in the list's header; every other `FlatList` prop passes through.
 * Boundary: no styling of its own beyond the card layout. A phone has no columns, so `variant`, `isStickyHeader` and
 *           `maxHeight` are accepted and read as nothing, and a header press asks `nextSortDescriptor` for the sort,
 *           because the chooser has no header cell to press. A selectable row is one pressable `checkbox` (several) or
 *           `radio` (one) that reads out its cells; the box inside it is drawn hidden from VoiceOver and TalkBack so the
 *           row is not read twice. There is no select-all control: on a touch list a row is chosen at a time. Empty and
 *           loading are two states: `isLoading` shows a spinner beside `loadingLabel`, read once as text, and
 *           `emptyState` shows only when nothing loads. Strings a child returns are wrapped in `Text`, which
 *           React Native requires.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0313; ADR 0165 (HeroUI Native on native); ADR 0060 (right-to-left);
 *          WCAG 2.2 SC 1.3.1, 2.5.8, 4.1.2; owner decision 6 of STA-350 (thin wrappers).
 */
import { Checkbox as HeroCheckbox } from "heroui-native";
import { isValidElement, useState, type ReactNode } from "react";
import { FlatList, Pressable, View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#core/hooks/use-ui-text";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import { cellTextOf } from "#core/functions/cell-text-of.function";
import { keysOfSelection } from "#core/functions/keys-of-selection.function";
import { nextSortDescriptor } from "#core/functions/next-sort-descriptor.function";
import { Button } from "#native/button/button";
import { Spinner } from "#native/spinner/spinner";
import { Text } from "#native/text/text";
import type { TableProps } from "#native/table/table.props";

/** A cell's content: text a child returned is wrapped in `Text`, which React Native needs, and a node stays as given. */
function CellContent({
  content,
  isTitle,
}: {
  readonly content: ReactNode;
  readonly isTitle: boolean;
}) {
  return typeof content === "string" || typeof content === "number" ? (
    <Text className={isTitle ? "font-semibold" : ""}>{content}</Text>
  ) : (
    content
  );
}

/** The spinner and the words that stand in for rows while they load; the words are the one thing read out. */
function LoadingContent({ text }: { readonly text: string }) {
  return (
    <View className="flex-row items-center justify-center gap-2 p-6">
      <Spinner size="sm" />
      <Text>{text}</Text>
    </View>
  );
}

/**
 * A list of rows on the contract of the web table. The rows are `items`; a row's cells come from `renderCell` or from
 * the property each column's `id` names. The selection and the sort are controlled by the app: `onSelectionChange`
 * reports the ids now selected, and `onSortChange` the sort a press on a sortable column's button asks for.
 */
export function Table<TItem extends CollectionItem = CollectionItem>({
  label,
  items,
  columns,
  renderCell,
  // Accepted so an app writes one table for both runtimes; a list of cards has no tray, sticky header or scroll height.
  variant: _variant,
  isStickyHeader: _isStickyHeader,
  maxHeight: _maxHeight,
  selectionMode = "none",
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  sortDescriptor,
  onSortChange,
  emptyState,
  isLoading = false,
  loadingLabel,
  hasMore = false,
  onLoadMore,
  accessibilityState,
  ...rest
}: TableProps<TItem>) {
  // The selection always runs controlled here: the rows are plain pressables with no state of their own.
  const [own, setOwn] = useState<readonly string[]>(defaultSelectedKeys ?? []);
  const selected = selectedKeys ?? own;
  const t = useUiText();
  const loadingText = loadingLabel ?? t(UI_KEYS.ui.table.loading);
  const rowHeaderId = (columns.find((column) => column.isRowHeader) ?? columns[0])?.id;
  const sortableColumns = columns.filter((column) => column.isSortable);

  const choose = (id: string) => {
    const ids = items.map((item) => item.id);
    // One selection replaces; several toggle, kept in the items' order so a controlled value does not reshuffle.
    const next =
      selectionMode === "single"
        ? [id]
        : keysOfSelection(
            selected.includes(id) ? selected.filter((key) => key !== id) : [...selected, id],
            ids,
          );
    setOwn(next);
    onSelectionChange?.(next);
  };

  const sortLabel = (column: TableColumn) => {
    const direction = sortDescriptor?.column === column.id ? sortDescriptor.direction : undefined;
    return `${t(UI_KEYS.ui.table.sort_by)} ${column.label}${direction ? `, ${t(UI_KEYS.ui.table[direction])}` : ""}`;
  };

  // A string is wrapped in `Text`, which React Native requires; any other node must be an element, as FlatList asks.
  const empty = isLoading ? (
    <LoadingContent text={loadingText} />
  ) : typeof emptyState === "string" ? (
    <Text tone="muted" className="p-6 text-center">
      {emptyState}
    </Text>
  ) : isValidElement(emptyState) ? (
    emptyState
  ) : null;

  return (
    <FlatList
      {...rest}
      role="list"
      accessibilityLabel={label}
      accessibilityState={{ ...accessibilityState, busy: isLoading }}
      data={items}
      extraData={[selected, sortDescriptor, columns, renderCell]}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const isSelected = selected.includes(item.id);
        const cells = (
          <View className="flex-1 gap-1">
            {columns.map((column) => (
              <View key={column.id} className={column.id === rowHeaderId ? "" : "gap-0.5"}>
                {column.id === rowHeaderId ? null : (
                  <Text type="caption" tone="muted">
                    {column.label}
                  </Text>
                )}
                <CellContent
                  content={renderCell ? renderCell(item, column) : cellTextOf(item, column.id)}
                  isTitle={column.id === rowHeaderId}
                />
              </View>
            ))}
          </View>
        );
        const card = "flex-row items-start gap-3 border-b border-separator p-4";
        return selectionMode === "none" ? (
          <View className={card}>{cells}</View>
        ) : (
          <Pressable
            role={selectionMode === "multiple" ? "checkbox" : "radio"}
            accessibilityState={{ checked: isSelected, selected: isSelected }}
            onPress={() => choose(item.id)}
            className={`${card} ${isSelected ? "bg-accent-soft" : ""}`}
          >
            {selectionMode === "multiple" ? (
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                // The row takes every press, so the box only shows the state.
                pointerEvents="none"
              >
                <HeroCheckbox isSelected={isSelected} />
              </View>
            ) : null}
            {cells}
          </Pressable>
        );
      }}
      ListHeaderComponent={
        sortableColumns.length === 0 ? null : (
          <View
            role="toolbar"
            accessibilityLabel={t(UI_KEYS.ui.table.sort_by)}
            className="flex-row flex-wrap gap-2 p-4"
          >
            {sortableColumns.map((column) => {
              const direction =
                sortDescriptor?.column === column.id ? sortDescriptor.direction : undefined;
              return (
                <Button
                  key={column.id}
                  size="sm"
                  variant={direction ? "secondary" : "tertiary"}
                  label={sortLabel(column)}
                  accessibilityState={{ selected: direction !== undefined }}
                  {...(direction
                    ? { endIcon: direction === "ascending" ? "arrow-up" : "arrow-down" }
                    : {})}
                  onPress={() => onSortChange?.(nextSortDescriptor(sortDescriptor, column.id))}
                >
                  {column.label}
                </Button>
              );
            })}
          </View>
        )
      }
      ListEmptyComponent={empty}
      ListFooterComponent={
        isLoading && items.length > 0 ? <LoadingContent text={loadingText} /> : null
      }
      // `onEndReached` fires as soon as the end is in view, so it is silent while a page is already coming.
      {...(hasMore && onLoadMore && !isLoading ? { onEndReached: () => onLoadMore() } : {})}
    />
  );
}
