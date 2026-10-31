/**
 * Stackra file contract:
 * Purpose: the web `ColumnMenu`, the menu at the end of a column header: sort ascending or descending, add to or remove
 *          from a multi-sort, filter by the column, pin to the start or end or unpin, hide, group by it or stop, the
 *          footer summary (sum, average, count, lowest, highest) of a number column, a keyboard resize, and move the
 *          column towards the start or end (announced politely).
 * Boundary: an `ActionMenu`; every item changes the `useCollection` engine it is given. Items that cannot apply (sort on a
 *           column that does not sort, hide on the row header) are left out, not disabled.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1, 2.5.7, 4.1.3.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import type { ReactElement } from "react";

import { AggregateKind } from "#contracts/enums/aggregate-kind.enum";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { MenuItem } from "#contracts/types/menu-item.type";
import type { MenuSection } from "#contracts/types/menu-section.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { DATA_GRID_KEYS } from "#core/constants/data-grid-keys.constant";
import { ActionMenu } from "#react/action-menu/action-menu";
import { COLUMN_MENU_ICONS } from "#react/data-table/column-menu-icons.constant";
import type { ColumnMenuProps } from "#react/data-table/column-menu.props";
import { useUiText } from "#react/hooks/use-ui-text";

/** The items' icons. */
const I = COLUMN_MENU_ICONS;

/** How long the menu takes to close and give focus back, before a keyboard resize takes it. */
const RESIZE_AFTER_CLOSE_MS = motionTiming(STACKRA_THEME, "base").durationMs;

/** The words. */
const K = COLLECTION_KEYS.ui.collection;

/** Entries given only when they apply; the parameter type keeps each literal's icon name typed. */
const when = (condition: boolean, ...entries: MenuItem[]): MenuItem[] => (condition ? entries : []);

/** A polite word for screen readers: the header moved under their focus. */
const say = (message: string) => {
  const region = document.querySelector("[data-collection-announcer]");
  if (region) region.textContent = message;
};

/** The menu of one column header. */
export function ColumnMenu<TItem extends CollectionItem = CollectionItem>({
  column,
  collection,
  onStartResize,
  onFilterColumn,
}: ColumnMenuProps<TItem>): ReactElement {
  const t = useUiText();
  const { state } = collection;
  const id = column.id;
  const rank = state.sort.findIndex((key) => key.column === id);
  const order = collection.columns.map((entry) => entry.id);
  const index = order.indexOf(id);
  const move = (to: number) => {
    collection.moveColumn(id, to);
    say(t(K.column_moved, { label: column.label, position: to + 1, count: order.length }));
  };

  const sortItems: MenuItem[] = column.isSortable
    ? [
        {
          id: "sort-ascending",
          label: t(K.sort_ascending),
          icon: I.ascending,
          onPress: () => collection.setSort([{ column: id, direction: "ascending" }]),
        },
        {
          id: "sort-descending",
          label: t(K.sort_descending),
          icon: I.descending,
          onPress: () => collection.setSort([{ column: id, direction: "descending" }]),
        },
        rank < 0
          ? {
              id: "sort-add",
              label: t(K.add_sort),
              icon: I.addSort,
              onPress: () => collection.toggleSort(id, true),
            }
          : {
              id: "sort-remove",
              label: t(K.clear_sort),
              onPress: () => collection.setSort(state.sort.filter((key) => key.column !== id)),
            },
      ]
    : [];
  const viewItems: MenuItem[] = [
    ...when(onFilterColumn !== undefined, {
      id: "filter",
      label: t(K.filter_column),
      icon: I.filter,
      onPress: () => onFilterColumn?.(id),
    }),
    ...when(column.isGroupable === true && state.groupBy === id, {
      id: "ungroup",
      label: t(K.ungroup),
      onPress: () => collection.setGroupBy(null),
    }),
    ...when(column.isGroupable === true && state.groupBy !== id, {
      id: "group",
      label: t(K.group_by_column),
      icon: I.group,
      onPress: () => collection.setGroupBy(id),
    }),
    ...when(column.type === "number", {
      id: "summary",
      label: t(K.summary),
      icon: I.summary,
      items: [
        {
          id: "summary-none",
          label: t(K.summary_none),
          onPress: () => collection.setAggregate(id, null),
        },
        ...AggregateKind.map((kind) => ({
          id: `summary-${kind}`,
          label: t(DATA_GRID_KEYS.ui.data_table_tools[`aggregate_${kind}`]),
          onPress: () => collection.setAggregate(id, kind),
        })),
      ],
    }),
  ];
  const columnItems: MenuItem[] = [
    ...when(column.pin === undefined || column.pin === "end", {
      id: "pin-start",
      label: t(K.pin_start),
      icon: I.pin,
      onPress: () => collection.updateColumn(id, { pin: "start" }),
    }),
    ...when(column.pin === undefined || column.pin === "start", {
      id: "pin-end",
      label: t(K.pin_end),
      icon: I.pin,
      onPress: () => collection.updateColumn(id, { pin: "end" }),
    }),
    ...when(column.pin !== undefined, {
      id: "unpin",
      label: t(K.unpin),
      icon: I.unpin,
      onPress: () => collection.updateColumn(id, { pin: null }),
    }),
    ...when(index > 0, {
      id: "move-start",
      label: t(K.move_start),
      onPress: () => move(index - 1),
    }),
    ...when(index < order.length - 1, {
      id: "move-end",
      label: t(K.move_end),
      onPress: () => move(index + 1),
    }),
    ...when(onStartResize !== undefined, {
      id: "resize",
      label: t(K.resize_column),
      icon: I.resize,
      // After the menu has closed and given focus back to its button, so the resizer keeps the focus it takes.
      onPress: () => setTimeout(() => onStartResize?.(), RESIZE_AFTER_CLOSE_MS),
    }),
    ...when(column.canHide, {
      id: "hide",
      label: t(K.hide_column),
      icon: I.hide,
      onPress: () => collection.updateColumn(id, { isHidden: true }),
    }),
  ];
  const sections: MenuSection[] = [
    { id: "sort", title: t(K.sort), isTitleHidden: true, items: sortItems },
    { id: "view", title: t(K.group), isTitleHidden: true, items: viewItems },
    { id: "column", title: t(K.editor_title), isTitleHidden: true, items: columnItems },
  ].filter((section) => section.items.length > 0);
  return (
    <ActionMenu
      label={t(K.column_menu, { label: column.label })}
      icon="ellipsis"
      size="sm"
      variant="ghost"
      sections={sections}
    />
  );
}
