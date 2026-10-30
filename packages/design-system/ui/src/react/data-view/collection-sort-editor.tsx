/**
 * Stackra file contract:
 * Purpose: the web `CollectionSortEditor`, the multi-sort of a collection: its keys as a `SortableList` (dragged by the
 *          handle or moved from the keyboard to change which key leads), each with a direction switch and a remove
 *          button, and a select that adds a sortable column as the next key.
 * Boundary: every change sets the engine's sort keys (back on the first page).
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1, 2.1.1, 2.5.7.
 */
import type { ReactElement } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { DATA_VIEW_ICONS } from "#react/data-view/data-view-icons.constant";
import type { CollectionSortEditorProps } from "#react/data-view/collection-sort-editor.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import { Select } from "#react/select/select";
import { SortableList } from "#react/sortable-list/sortable-list";

/** The words. */
const K = COLLECTION_KEYS.ui.collection;

/** Edits a collection's sort keys. */
export function CollectionSortEditor<TItem extends CollectionItem = CollectionItem>({
  collection,
  label,
}: CollectionSortEditorProps<TItem>): ReactElement {
  const t = useUiText();
  const { sort } = collection.state;
  const labelOf = (id: string) => collection.columns.find((column) => column.id === id)?.label ?? id;
  const free = collection.columns.filter(
    (column) => column.isSortable && !sort.some((key) => key.column === column.id),
  );
  return (
    <div className="grid gap-3" data-slot="collection-sort-editor">
      {sort.length === 0 ? <p className="m-0 text-sm text-muted">{t(K.sort_empty)}</p> : null}
      {sort.length > 0 ? (
        <SortableList
          label={t(K.sort_title, { label })}
          items={sort.map((key) => ({ id: key.column, label: labelOf(key.column) }))}
          onReorder={(items) =>
            collection.setSort(
              items.flatMap((item) => sort.filter((key) => key.column === item.id)),
            )
          }
          renderItem={(item) => {
            const key = sort.find((entry) => entry.column === item.id);
            const isAscending = key?.direction !== "descending";
            return (
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <IconButton
                  size="sm"
                  variant="secondary"
                  icon={isAscending ? DATA_VIEW_ICONS.ascending : DATA_VIEW_ICONS.descending}
                  label={`${t(K.sort_direction, { label: item.label })}: ${t(isAscending ? UI_KEYS.ui.table.ascending : UI_KEYS.ui.table.descending)}`}
                  onPress={() =>
                    collection.setSort(
                      sort.map((entry) =>
                        entry.column === item.id
                          ? { ...entry, direction: isAscending ? "descending" : "ascending" }
                          : entry,
                      ),
                    )
                  }
                />
                <IconButton
                  size="sm"
                  variant="ghost"
                  icon="x"
                  label={t(K.remove_sort, { label: item.label })}
                  onPress={() => collection.setSort(sort.filter((entry) => entry.column !== item.id))}
                />
              </div>
            );
          }}
        />
      ) : null}
      {free.length > 0 ? (
        <Select
          aria-label={t(K.add_sort_key)}
          placeholder={t(K.add_sort_key)}
          items={free.map((column) => ({ id: column.id, label: column.label }))}
          value={null}
          isFullWidth
          onChange={(id) => {
            if (id) collection.setSort([...sort, { column: id, direction: "ascending" }]);
          }}
        />
      ) : null}
    </div>
  );
}
