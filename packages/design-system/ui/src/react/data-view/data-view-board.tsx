/**
 * Stackra file contract:
 * Purpose: the web `DataViewBoard`, DataView's Board view: the engine's rows as cards in kanban columns by one field
 *          (a `choice` column's options in order, then any other value found), each column a React Aria `GridList` with
 *          its count. A card moves to another column by drag and drop (pointer, or the keyboard and a screen reader
 *          through React Aria: Enter on the card's handle, Tab to a column, Enter to drop) or from its "Move to" menu,
 *          and the move is said politely. A press (Enter) on a card opens it. With `isVirtualized` each column draws
 *          only the cards in view.
 * Boundary: it writes nothing: a move calls `board.onMove`, and the card changes column once the app passes the row
 *           back. Within a column the cards keep the engine's order (its sort), so a drop inside its own column does
 *           nothing. The menu is the drag's single-pointer alternative (WCAG 2.5.7). Words come from the `ui`
 *           catalogue; the handle, the menu and the columns follow the logical direction.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 4 (Board view); ADR 0165 (React Aria on web);
 *          WCAG 2.2 SC 1.3.1, 2.1.1, 2.5.7, 4.1.2, 4.1.3; STA-1371.
 */
import { cn as heroCn } from "@heroui/react";
import { useState, type ReactElement, type ReactNode } from "react";
import {
  Button as AriaButton,
  DropIndicator,
  GridList,
  GridListItem,
  ListLayout,
  Virtualizer,
  useDragAndDrop,
  type DropItem,
} from "react-aria-components";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { ResolvedCollectionColumn } from "#contracts/types/resolved-collection-column.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { cellTextOf } from "#core/functions/cell-text-of.function";
import { dataViewFieldsOf } from "#core/functions/data-view-fields-of.function";
import { ActionMenu } from "#react/action-menu/action-menu";
import type { DataViewBoardProps } from "#react/data-view/data-view-board.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";

/** HeroUI's class joiner, always a string (its type allows `undefined`). */
const cn = (...parts: Parameters<typeof heroCn>): string => heroCn(...parts) ?? "";

/** The words. */
const K = COLLECTION_KEYS.ui.collection;

/** The drag type of a card: its row id. Only a board's columns accept it. */
const CARD_TYPE = "application/x-stackra-board-card";

/** One board column: its value, its name and its cards. */
interface BoardLane<TItem> {
  readonly value: string;
  readonly name: string;
  readonly items: readonly TItem[];
}

/** One column of cards, a drop target for cards of the other columns. */
function Lane<TItem extends CollectionItem>({
  lane,
  label,
  isVirtualized,
  nameOf,
  renderCard,
  onDrop,
  onItemPress,
}: {
  readonly lane: BoardLane<TItem>;
  readonly label: string;
  readonly isVirtualized: boolean;
  readonly nameOf: (item: TItem) => string;
  readonly renderCard: (item: TItem) => ReactNode;
  readonly onDrop: (ids: readonly string[], value: string) => void;
  readonly onItemPress: ((item: TItem) => void) | undefined;
}) {
  const t = useUiText();
  const take = async (items: readonly DropItem[]) => {
    const ids = await Promise.all(
      items.flatMap((item) => (item.kind === "text" ? [item.getText(CARD_TYPE)] : [])),
    );
    onDrop(ids, lane.value);
  };
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) =>
      [...keys].map((key) => {
        const item = lane.items.find((entry) => entry.id === key);
        return { "text/plain": item ? nameOf(item) : String(key), [CARD_TYPE]: String(key) };
      }),
    acceptedDragTypes: [CARD_TYPE],
    getDropOperation: () => "move",
    onInsert: (event) => void take(event.items),
    onRootDrop: (event) => void take(event.items),
    renderDropIndicator: (target) => (
      <DropIndicator
        target={target}
        className="h-0.5 rounded-[var(--radius-pill)] bg-transparent data-[drop-target]:bg-accent"
      />
    ),
  });
  const list = (
    <GridList
      aria-label={t(K.board_column, { label, column: lane.name })}
      items={lane.items}
      dragAndDropHooks={dragAndDropHooks}
      {...(onItemPress
        ? {
            onAction: (key) => {
              const item = lane.items.find((entry) => entry.id === key);
              if (item) onItemPress(item);
            },
          }
        : {})}
      renderEmptyState={() => (
        <p className="m-0 px-2 py-6 text-center text-sm text-muted">{t(K.board_empty)}</p>
      )}
      className={cn(
        "grid min-h-24 content-start gap-2 overflow-auto rounded-[var(--radius-control)] p-1 outline-none",
        "data-[drop-target]:bg-accent-soft data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus",
      )}
      style={{ maxHeight: "32rem" }}
    >
      {(item) => (
        <GridListItem
          id={item.id}
          textValue={nameOf(item)}
          className={cn(
            "relative flex items-start gap-1 border border-separator bg-surface p-3 shadow-surface outline-none",
            "data-[dragging]:opacity-50 data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus",
            onItemPress && "cursor-pointer",
          )}
          style={{ borderRadius: "var(--radius-container)" }}
        >
          <AriaButton
            slot="drag"
            aria-label={t(K.row_handle, { name: nameOf(item) })}
            className="-ms-1 inline-flex size-6 shrink-0 cursor-grab items-center justify-center rounded-[var(--radius-control)] text-muted outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus"
          >
            <Icon name="grip-vertical" size="sm" />
          </AriaButton>
          <div className="min-w-0 flex-1">{renderCard(item)}</div>
        </GridListItem>
      )}
    </GridList>
  );
  return (
    <section
      aria-label={lane.name}
      className="grid w-72 shrink-0 content-start gap-2 bg-surface-secondary p-2"
      style={{ borderRadius: "var(--radius-container)" }}
    >
      <h3 className="m-0 flex items-center justify-between gap-2 px-1 text-sm font-medium">
        <span className="truncate">{lane.name}</span>
        <span className="shrink-0 text-xs font-normal text-muted">
          {t(K.board_count, { count: lane.items.length })}
        </span>
      </h3>
      {isVirtualized ? (
        // Only the cards in view are drawn; each is measured once it is.
        <Virtualizer layout={ListLayout} layoutOptions={{ estimatedRowHeight: 120, gap: 8 }}>
          {list}
        </Virtualizer>
      ) : (
        list
      )}
    </section>
  );
}

/** A collection drawn as kanban columns by one field. */
export function DataViewBoard<TItem extends CollectionItem = CollectionItem>({
  collection,
  label,
  board,
  renderCell,
  onItemPress,
  isVirtualized = false,
}: DataViewBoardProps<TItem>): ReactElement {
  const t = useUiText();
  const [said, setSaid] = useState("");
  const field = collection.columns.find((column) => column.id === board.field);
  const slots = dataViewFieldsOf(
    board.card,
    collection.visibleColumns.filter((column) => column.id !== board.field),
  );
  const valueOf = (item: TItem) => cellTextOf(item, board.field);
  const nameOf = (item: TItem) => (slots.title ? cellTextOf(item, slots.title.id) : "") || item.id;
  const show = (item: TItem, column: ResolvedCollectionColumn | undefined): ReactNode =>
    column === undefined
      ? null
      : renderCell
        ? renderCell(item, column)
        : cellTextOf(item, column.id);

  // The columns: a choice column's options in order, then any other value the rows hold.
  const known = (field?.options ?? []).map((option) => ({ value: option.id, name: option.label }));
  const found = [...new Set(collection.rows.map(valueOf))]
    .filter((value) => !known.some((entry) => entry.value === value))
    .map((value) => ({ value, name: value }));
  const lanes: readonly BoardLane<TItem>[] = [...known, ...found].map((entry) => ({
    ...entry,
    items: collection.rows.filter((item) => valueOf(item) === entry.value),
  }));
  const nameOfValue = (value: string) => lanes.find((lane) => lane.value === value)?.name ?? value;

  const move = (ids: readonly string[], value: string) => {
    for (const id of ids) {
      const item = collection.rows.find((entry) => entry.id === id);
      if (!item || valueOf(item) === value) continue;
      void board.onMove(item, value);
      setSaid(t(K.card_moved, { name: nameOf(item), column: nameOfValue(value) }));
    }
  };

  const renderCard = (item: TItem) => (
    <div className="grid gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 font-medium">{show(item, slots.title) ?? item.id}</span>
        <ActionMenu
          label={t(K.move_card, { name: nameOf(item) })}
          variant="ghost"
          sections={[
            {
              id: "move",
              title: t(K.move_to),
              items: lanes
                .filter((lane) => lane.value !== valueOf(item))
                .map((lane) => ({
                  id: lane.value,
                  label: lane.name,
                  onPress: () => move([item.id], lane.value),
                })),
            },
          ]}
        />
      </div>
      {slots.subtitle ? (
        <span className="text-sm text-muted">{show(item, slots.subtitle)}</span>
      ) : null}
      {slots.meta ? <span className="text-sm">{show(item, slots.meta)}</span> : null}
      {slots.fields.length > 0 ? (
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
          {slots.fields.map((column) => (
            <div key={column.id} className="contents">
              <dt className="text-muted">{column.label}</dt>
              <dd className="m-0 min-w-0 truncate text-end">{show(item, column)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );

  return (
    <div data-slot="data-view-board" className="grid min-w-0 gap-2">
      <div className="flex min-w-0 items-start gap-3 overflow-x-auto pb-2">
        {lanes.map((lane) => (
          <Lane
            key={lane.value}
            lane={lane}
            label={label}
            isVirtualized={isVirtualized}
            nameOf={nameOf}
            renderCard={renderCard}
            onDrop={move}
            onItemPress={onItemPress}
          />
        ))}
      </div>
      <div role="status" className="sr-only">
        {said}
      </div>
    </div>
  );
}
