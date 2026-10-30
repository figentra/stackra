/**
 * Stackra file contract:
 * Purpose: the web `DataViewCards`, the cards and list views of a DataView, drawn from the same engine as the table: a
 *          responsive grid of cards (media on top, the title as a heading, the subtitle, the meta at the top end and the
 *          other fields as a description list), or a `List` of rows (leading media, primary and secondary text,
 *          trailing meta). Grouped rows sit under a heading per group with its count. A pressable card or row opens the record.
 * Boundary: it draws `collection.rows` (already searched, filtered, sorted and paged) and `collection.groups`, and keeps
 *           no state. A pressable card's title is the one button, stretched over the card, so the card is one tab stop.
 *           Cards and rows fill the container's width.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1, 2.4.4, 2.5.8.
 */
import { isValidElement, type ReactElement, type ReactNode } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { ResolvedCollectionColumn } from "#contracts/types/resolved-collection-column.type";
import { DATA_GRID_KEYS } from "#core/constants/data-grid-keys.constant";
import { cellTextOf } from "#core/functions/cell-text-of.function";
import { dataViewFieldsOf } from "#core/functions/data-view-fields-of.function";
import type { DataViewCardsProps } from "#react/data-view/data-view-cards.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { List } from "#react/list/list";

/** The cards or list view of a collection. */
export function DataViewCards<TItem extends CollectionItem = CollectionItem>({
  collection,
  label,
  fields,
  renderCell,
  onItemPress,
  layout = "cards",
}: DataViewCardsProps<TItem>): ReactElement {
  const t = useUiText();
  const slots = dataViewFieldsOf(fields, collection.visibleColumns);
  const valueOf = (item: TItem, column: ResolvedCollectionColumn | undefined): ReactNode =>
    column === undefined ? null : renderCell ? renderCell(item, column) : cellTextOf(item, column.id);
  const isList = layout === "list";

  const card = (item: TItem) => {
    const title = valueOf(item, slots.title) ?? item.id;
    const media = fields?.media?.(item);
    const titleNode = onItemPress ? (
      <button
        type="button"
        onClick={() => onItemPress(item)}
        className="text-start font-medium text-foreground outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:outline-2 focus-visible:after:outline-focus"
      >
        {title}
      </button>
    ) : (
      title
    );
    return (
      <li
        key={item.id}
        className="relative grid content-start gap-3 border border-separator bg-surface p-4 shadow-surface"
        style={{ borderRadius: "var(--radius-container)" }}
      >
        {media ? <div className="-mx-4 -mt-4 overflow-hidden" style={{ borderStartStartRadius: "inherit", borderStartEndRadius: "inherit" }}>{media}</div> : null}
        <div className="flex items-start justify-between gap-2">
          <h3 className="m-0 min-w-0 text-base">{titleNode}</h3>
          {slots.meta ? <span className="shrink-0 text-sm">{valueOf(item, slots.meta)}</span> : null}
        </div>
        {slots.subtitle ? (
          <p className="m-0 -mt-2 text-sm text-muted">{valueOf(item, slots.subtitle)}</p>
        ) : null}
        {slots.fields.length > 0 ? (
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            {slots.fields.map((column) => (
              <div key={column.id} className="contents">
                <dt className="text-muted">{column.label}</dt>
                <dd className="m-0 min-w-0 truncate text-end">{valueOf(item, column)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </li>
    );
  };

  const block = (items: readonly TItem[], name: string) =>
    isList ? (
      <List
        label={name}
        isAnimated={false}
        className="w-full"
        items={items.map((item) => {
          const media = fields?.media?.(item);
          return {
            id: item.id,
            title: valueOf(item, slots.title) ?? item.id,
            label: slots.title ? cellTextOf(item, slots.title.id) : item.id,
            description: slots.subtitle ? valueOf(item, slots.subtitle) : undefined,
            ...(isValidElement(media) ? { startIcon: media } : {}),
            endContent: slots.meta ? valueOf(item, slots.meta) : undefined,
            ...(onItemPress ? { hasChevron: true, onPress: () => onItemPress(item) } : {}),
          };
        })}
      />
    ) : (
      <ul
        aria-label={name}
        className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(16rem,100%),1fr))] gap-3 p-0"
      >
        {items.map(card)}
      </ul>
    );

  return (
    <div className={"grid w-full min-w-0 gap-4"} data-slot={`data-view-${layout}`}>
      {collection.groups
        ? collection.groups.map((group) => {
            const name = `${group.key} · ${t(DATA_GRID_KEYS.ui.data_table_tools.group_count, { count: group.items.length })}`;
            return (
              <section key={group.key} aria-label={name} className="grid gap-2">
                <h3 className="m-0 text-sm font-medium text-muted">{name}</h3>
                {block(group.items, name)}
              </section>
            );
          })
        : block(collection.rows, label)}
    </div>
  );
}
