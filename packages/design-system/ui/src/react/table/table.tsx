/**
 * Stackra file contract:
 * Purpose: the web `Table` on HeroUI v3's Table (React Aria): draws the shared contract (`items`, `columns`,
 *          `renderCell`, `selectionMode`, the selected ids, the controlled sort, `emptyState`, `isLoading`, `hasMore`,
 *          `onLoadMore`, the sticky header and `variant`) as HeroUI's scroll container, header, sortable column
 *          headers, rows and cells, reports the selection as a list of ids, and passes every other `div` prop to the
 *          table's root. The column tools of the collection family are drawn here too: multi-sort ranks (`sort`),
 *          `density`, React Aria's column resizer (pointer, and the keyboard through `startResize`), headers dragged to
 *          reorder (`onColumnMove`, mirrored in right-to-left), pinned columns that stay stuck at the logical start or end
 *          with an edge shadow while the rows scroll sideways, a header menu slot, and wrap or truncate per column.
 * Boundary: no styling of its own beyond utility classes. The table never sorts or pages the rows it is given: the sort
 *           is controlled and `onLoadMore` only asks. HeroUI draws no selection column, so a multiple selection adds the
 *           documented checkbox column (React Aria names each box and the select-all one), and a single selection
 *           selects the row on press with no column. Empty and loading are two states: `emptyState` shows only when
 *           nothing loads, and `isLoading` shows a spinner and says `loadingLabel` once through a status region, not
 *           once per row. With no rows either one stands in for the grid, in a group named by `label`, because React Aria
 *           draws them as `rowheader` cells (its loader also carries `aria-level`), which leave a grid's headers with no
 *           data cell to describe. A pinned column needs a width to stick at the right offset (160 when it has none).
 *           The table always fills its parent's width and keeps a floor, so a shrink-to-fit parent (a centred frame)
 *           never squeezes it to its content.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0303 (decision 7); ADR 0313;
 *          data-collection plan (owner, 2026-10-29); WCAG 2.2 SC 1.3.1, 2.1.1, 2.5.7, 4.1.2, 4.1.3; owner decision 6 of
 *          STA-350 (thin wrappers).
 */
import { Checkbox as HeroCheckbox, Table as HeroTable, cn as heroCn } from "@heroui/react";
import {
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type UIEvent,
} from "react";
import { useLocale } from "react-aria-components";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { SortDescriptor } from "#contracts/types/sort-descriptor.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { cellTextOf } from "#core/functions/cell-text-of.function";
import { keysOfSelection } from "#core/functions/keys-of-selection.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { Spinner } from "#react/spinner/spinner";
import type { TableProps } from "#react/table/table.props";

/** HeroUI's class joiner, always a string (its type allows `undefined`). */
const cn = (...parts: Parameters<typeof heroCn>): string => heroCn(...parts) ?? "";

/** The class that lines a column's cell text up; `start` is HeroUI's own. */
const ALIGN_CLASS = Object.freeze({
  start: "text-start",
  center: "text-center",
  end: "text-end",
  justify: "text-justify",
} as const);

/** The class that lines a sortable header up: HeroUI lays its label and arrow out as a row spread end to end. */
const HEADER_ALIGN_CLASS = Object.freeze({
  start: "",
  center: "justify-center gap-1",
  end: "justify-end gap-1",
  justify: "",
} as const);

/** The classes that keep a header in view over the rows: HeroUI paints the tray, so the header needs its own ground. */
const STICKY_CLASS = "sticky top-0 z-10 bg-surface-secondary";

/**
 * The cell padding and row height (32, 44 and 56 px) and the header padding of each density. Elements, not HeroUI's
 * `table__cell` classes: Tailwind reads an underscore in an arbitrary variant as a space, so those never matched.
 */
const DENSITY_CLASS = Object.freeze({
  compact: "[&_td]:h-8 [&_td]:py-1 [&_th]:h-8 [&_th]:py-0",
  normal: "[&_td]:h-11 [&_td]:py-2.5 [&_th]:h-11 [&_th]:py-1.5",
  roomy: "[&_td]:h-14 [&_td]:py-4 [&_th]:h-14 [&_th]:py-3",
} as const);

/**
 * The row height of each density in pixels. The header is one row too, and a sticky table's height is rounded down to
 * whole rows, so a sticky total row covers a whole row and never half of one (axe: a partly covered cell).
 */
const ROW_PX = Object.freeze({ compact: 32, normal: 44, roomy: 56 } as const);

/** The header label: it truncates only when its column is too narrow, and shows in full on hover or keyboard focus. */
const LABEL_CLASS =
  "block truncate group-hover/header:relative group-hover/header:z-20 group-hover/header:w-max group-hover/header:overflow-visible group-hover/header:bg-surface-secondary group-data-[focus-visible=true]/header:relative group-data-[focus-visible=true]/header:z-20 group-data-[focus-visible=true]/header:w-max group-data-[focus-visible=true]/header:overflow-visible group-data-[focus-visible=true]/header:bg-surface-secondary";

/**
 * The width a header needs to show its label whole beside its tools.
 * shortcut: about 7.5 px a character of the 12 px header text, not a measurement; measure with a canvas if it misfits.
 */
const headerWidthOf = (column: TableColumn, hasMenu: boolean): number =>
  Math.ceil(column.label.length * 7.5) + 32 + (hasMenu ? 36 : 0) + (column.isSortable ? 20 : 0);

/** The width of the selection column, so pinned columns after it stick at the right offset. */
const SELECTION_WIDTH = 44;

/** The width a pinned column without its own takes. */
const PINNED_WIDTH = 160;

/** The floor of the table's width: it fills a wider parent and never collapses in a shrink-to-fit one. */
const MIN_INLINE_SIZE = "min(36rem, calc(100vw - 6rem))";

/** The box a row or the header carries to select it; React Aria gives it its name and wires its state by slot. */
function SelectionCheckbox() {
  return (
    <HeroCheckbox slot="selection">
      {/* The press target is at least 24 px square (WCAG 2.2 SC 2.5.8), which HeroUI's bare control is not. */}
      <HeroCheckbox.Content className="inline-flex min-h-6 min-w-6 items-center justify-center">
        <HeroCheckbox.Control>
          <HeroCheckbox.Indicator />
        </HeroCheckbox.Control>
      </HeroCheckbox.Content>
    </HeroCheckbox>
  );
}

/** The spinner and the words that stand in for rows while they load. */
function LoadingContent({ text }: { readonly text: string }) {
  return (
    <span className="flex items-center justify-center gap-2 py-6">
      <Spinner size="sm" />
      <span>{text}</span>
    </span>
  );
}

/** The shadow a pinned column casts on the rows scrolling under it, shown only while there is something under it. */
function PinShadow({ edge }: { readonly edge: "start" | "end" }) {
  return (
    <span
      aria-hidden="true"
      data-pin-shadow={edge}
      className={cn(
        "pointer-events-none absolute inset-y-0 w-3 opacity-0 transition-opacity motion-reduce:transition-none",
        edge === "start"
          ? "-end-3 bg-linear-to-r from-black/12 to-transparent group-data-[scroll-start]/scroll:opacity-100 rtl:bg-linear-to-l"
          : "-start-3 bg-linear-to-l from-black/12 to-transparent group-data-[scroll-end]/scroll:opacity-100 rtl:bg-linear-to-r",
      )}
    />
  );
}

/** A cell's wrapping class by its column's `wrap`. */
const wrapClass = (column: TableColumn) =>
  column.wrap === false
    ? "block truncate"
    : column.wrap === true
      ? "block whitespace-normal break-words"
      : "";

/**
 * A table of rows and columns. The rows are `items`, the cells come from `renderCell` or from the property each column's
 * `id` names, and the selection and the sort are controlled by the app: `onSelectionChange` reports the ids now
 * selected, and `onSortChange` the sort a press on a sortable header asks for.
 */
export function Table<TItem extends CollectionItem = CollectionItem>({
  label,
  items,
  columns,
  renderCell,
  variant,
  selectionMode = "none",
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  sortDescriptor,
  sort,
  onSortChange,
  emptyState,
  isLoading = false,
  loadingLabel,
  hasMore = false,
  onLoadMore,
  isStickyHeader = false,
  maxHeight = "24rem",
  density = "normal",
  isColumnResizable = false,
  onColumnResize,
  onColumnMove,
  renderColumnMenu,
  rowClassName,
  className,
  style,
  ...rest
}: TableProps<TItem>): ReactElement {
  const t = useUiText();
  const { direction } = useLocale();
  const isMultiple = selectionMode === "multiple";
  const loadingText = loadingLabel ?? t(UI_KEYS.ui.table.loading);
  // React Aria wants one row header, whose cell names the row; the first column is it unless the app picked one.
  const rowHeaderId = (columns.find((column) => column.isRowHeader) ?? columns[0])?.id;
  const hasEmptyState = emptyState !== undefined && emptyState !== null && emptyState !== false;
  const isPaged = hasMore && onLoadMore !== undefined;
  const hasRows = items.length > 0;
  const sortKeys: readonly SortDescriptor[] = sort ?? (sortDescriptor ? [sortDescriptor] : []);
  const primarySort = sortKeys[0];
  // Live widths while a resize drags; the app's widths win once it reports the end.
  const [liveWidths, setLiveWidths] = useState<Readonly<Record<string, number>>>({});
  const [dragged, setDragged] = useState<string | null>(null);
  // The column being dragged, read by the drop handlers at once (state only restyles the header).
  const draggedId = useRef<string | null>(null);
  const [dropAt, setDropAt] = useState<{
    readonly id: string;
    readonly side: "start" | "end";
  } | null>(null);
  const [scroll, setScroll] = useState({ start: false, end: false });

  const hasPins = columns.some((column) => column.pin !== undefined);
  const isLaidOut = isColumnResizable || hasPins || columns.some((column) => column.width);
  // A given width never cuts its own header short; a drag can still narrow it (the label then truncates).
  const restingWidthOf = (column: TableColumn): number | undefined => {
    const given = column.width ?? (column.pin ? PINNED_WIDTH : undefined);
    return given === undefined
      ? undefined
      : Math.max(given, headerWidthOf(column, renderColumnMenu !== undefined));
  };
  const widthOf = (column: TableColumn): number | undefined =>
    liveWidths[column.id] ?? restingWidthOf(column);

  // The offset of each pinned column from its edge: the widths of the pinned columns before it (and the boxes).
  const startPins = columns.filter((column) => column.pin === "start");
  const endPins = columns.filter((column) => column.pin === "end");
  const offsets = new Map<string, number>();
  startPins.reduce(
    (offset, column) => {
      offsets.set(column.id, offset);
      return offset + (widthOf(column) ?? PINNED_WIDTH);
    },
    isMultiple ? SELECTION_WIDTH : 0,
  );
  endPins.reduceRight((offset, column) => {
    offsets.set(column.id, offset);
    return offset + (widthOf(column) ?? PINNED_WIDTH);
  }, 0);
  const lastStartPin = startPins.at(-1)?.id;
  const firstEndPin = endPins[0]?.id;
  const pinStyle = (column: TableColumn): CSSProperties =>
    column.pin === "start"
      ? { position: "sticky", insetInlineStart: offsets.get(column.id), zIndex: 2 }
      : column.pin === "end"
        ? { position: "sticky", insetInlineEnd: offsets.get(column.id), zIndex: 2 }
        : {};
  const pinShadow = (column: TableColumn) =>
    column.id === lastStartPin ? (
      <PinShadow edge="start" />
    ) : column.id === firstEndPin ? (
      <PinShadow edge="end" />
    ) : null;

  const standIn: ReactNode = isLoading ? <LoadingContent text={loadingText} /> : emptyState;
  const isStoodIn = !hasRows && (isLoading || hasEmptyState);
  const headerClass = (column: TableColumn) =>
    cn(
      "group/header",
      isStickyHeader ? STICKY_CLASS : "",
      column.pin ? "bg-surface-secondary" : "",
      ALIGN_CLASS[column.align ?? "start"],
      dragged === column.id && "opacity-50",
      dropAt?.id === column.id &&
        (dropAt.side === "start"
          ? "shadow-[inset_2px_0_0_var(--accent)] rtl:shadow-[inset_-2px_0_0_var(--accent)]"
          : "shadow-[inset_-2px_0_0_var(--accent)] rtl:shadow-[inset_2px_0_0_var(--accent)]"),
    );

  // The grip drags a column with the pointer (mouse, pen or touch): it captures the pointer, the header under it is
  // the drop target (its logical half says before or after it) and the release moves the column. It stops the press
  // from reaching the header, whose press sorts. The keyboard moves a column from its menu or the column editor.
  const targetOf = (event: PointerEvent<HTMLElement>) => {
    const header = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[role=columnheader][data-key]");
    const id = header?.getAttribute("data-key");
    if (!header || !id || !columns.some((column) => column.id === id)) return null;
    const box = header.getBoundingClientRect();
    const isLeftHalf = event.clientX < box.left + box.width / 2;
    return {
      id,
      side: (isLeftHalf === (direction !== "rtl") ? "start" : "end") as "start" | "end",
    };
  };
  const gripProps = (column: TableColumn) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      draggedId.current = column.id;
      setDragged(column.id);
    },
    onMouseDown: (event: MouseEvent<HTMLElement>) => event.stopPropagation(),
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (draggedId.current === null) return;
      const target = targetOf(event);
      const next = target && target.id !== draggedId.current ? target : null;
      if (next?.id !== dropAt?.id || next?.side !== dropAt?.side) setDropAt(next);
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      const moving = draggedId.current;
      const target = targetOf(event);
      draggedId.current = null;
      setDragged(null);
      setDropAt(null);
      if (moving === null || !target || target.id === moving || !onColumnMove) return;
      const order = columns.map((entry) => entry.id).filter((id) => id !== moving);
      onColumnMove(moving, order.indexOf(target.id) + (target.side === "end" ? 1 : 0));
    },
    onPointerCancel: () => {
      draggedId.current = null;
      setDragged(null);
      setDropAt(null);
    },
  });

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    // Right-to-left scrolls to negative offsets, so the distance from the start is the absolute value.
    const fromStart = Math.abs(element.scrollLeft);
    const next = {
      start: fromStart > 1,
      end: fromStart + element.clientWidth < element.scrollWidth - 1,
    };
    if (next.start !== scroll.start || next.end !== scroll.end) setScroll(next);
  };

  const content = (
    <HeroTable.Content
      aria-label={label}
      // React Aria's own default, which HeroUI turns to "tab": the arrow keys walk the cells and land on a
      // cell's link or button, so a row menu is reachable from the keyboard (WCAG 2.1.1).
      keyboardNavigationBehavior="arrow"
      selectionMode={selectionMode}
      // A box per row for several; for one, a press on the row selects it, the way a list does.
      selectionBehavior={isMultiple ? "toggle" : "replace"}
      // The table always runs controlled by the app or by React Aria; ids are strings, never a `Set`.
      {...(selectedKeys ? { selectedKeys: new Set(selectedKeys) } : {})}
      {...(defaultSelectedKeys ? { defaultSelectedKeys: new Set(defaultSelectedKeys) } : {})}
      onSelectionChange={(keys) =>
        onSelectionChange?.(
          keysOfSelection(
            keys,
            items.map((item) => item.id),
          ),
        )
      }
      {...(primarySort ? { sortDescriptor: primarySort } : {})}
      onSortChange={(next) =>
        onSortChange?.({ column: String(next.column), direction: next.direction })
      }
    >
      <HeroTable.Header>
        {isMultiple ? (
          <HeroTable.Column
            {...(isLaidOut ? { width: SELECTION_WIDTH, minWidth: SELECTION_WIDTH } : {})}
            className={cn(
              "w-10 pe-0",
              isStickyHeader && STICKY_CLASS,
              startPins.length > 0 && "bg-surface-secondary",
            )}
            style={
              startPins.length > 0 ? { position: "sticky", insetInlineStart: 0, zIndex: 12 } : {}
            }
          >
            {/* The box names itself; the text keeps the header from being an empty one for a checker. */}
            <span className="sr-only">{t(UI_KEYS.ui.table.selection_column)}</span>
            <SelectionCheckbox />
          </HeroTable.Column>
        ) : null}
        <HeroTable.Collection
          items={columns}
          dependencies={[renderColumnMenu, sortKeys, liveWidths, dragged, dropAt]}
        >
          {(column) => {
            const width = widthOf(column);
            const rank = sortKeys.findIndex((key) => key.column === column.id);
            const ownSort = rank >= 0 ? sortKeys[rank] : undefined;
            const hasMenu = renderColumnMenu !== undefined;
            const isResizable = isColumnResizable && column.isResizable !== false;
            return (
              <HeroTable.Column
                id={column.id}
                isRowHeader={column.id === rowHeaderId}
                allowsSorting={column.isSortable === true}
                className={headerClass(column)}
                // Above the scrolling headers (`z-10` when sticky), so a pinned header is never covered.
                style={{ ...pinStyle(column), ...(column.pin ? { zIndex: 12 } : {}) }}
                {...(isLaidOut
                  ? omitUndefined({
                      width,
                      minWidth: column.minWidth ?? 64,
                      maxWidth: column.maxWidth ?? 640,
                    })
                  : {})}
              >
                {({ startResize }) => (
                  // The drag is the header content's: React Aria's column drops a `draggable` given to it.
                  <div className={cn("flex min-w-0 items-center gap-1", hasMenu && "pe-1")}>
                    {onColumnMove ? (
                      // For the pointer only: the keyboard moves a column from its menu or the column editor.
                      <span
                        aria-hidden="true"
                        className="-ms-2 inline-flex w-3 shrink-0 cursor-grab touch-none justify-center text-muted opacity-0 transition-opacity group-hover/header:opacity-100 data-[dragging]:opacity-100 motion-reduce:transition-none"
                        data-dragging={dragged === column.id || undefined}
                        {...gripProps(column)}
                      >
                        <Icon name="grip-vertical" size="sm" className="pointer-events-none" />
                      </span>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      {column.isSortable ? (
                        <HeroTable.SortableColumnHeader
                          // The rank's own direction: React Aria marks only the first key.
                          {...(ownSort ? { sortDirection: ownSort.direction } : {})}
                          className={HEADER_ALIGN_CLASS[column.align ?? "start"]}
                        >
                          <span className={LABEL_CLASS}>{column.label}</span>
                          {rank > 0 || (rank === 0 && sortKeys.length > 1) ? (
                            <span className="ms-1 inline-flex size-4 items-center justify-center rounded-full bg-default text-[0.625rem] text-foreground tabular-nums">
                              <span aria-hidden="true">{rank + 1}</span>
                              <span className="sr-only">
                                {t(COLLECTION_KEYS.ui.collection.sort_rank, { rank: rank + 1 })}
                              </span>
                            </span>
                          ) : null}
                        </HeroTable.SortableColumnHeader>
                      ) : (
                        <span className={LABEL_CLASS}>{column.label}</span>
                      )}
                    </div>
                    {renderColumnMenu?.(column, { startResize })}
                    {isResizable ? (
                      <HeroTable.ColumnResizer
                        aria-label={t(COLLECTION_KEYS.ui.collection.resize_handle, {
                          label: column.label,
                        })}
                        className="rtl:-translate-x-1/2"
                      />
                    ) : null}
                    {pinShadow(column)}
                  </div>
                )}
              </HeroTable.Column>
            );
          }}
        </HeroTable.Collection>
      </HeroTable.Header>
      <HeroTable.Body>
        <HeroTable.Collection
          items={items}
          dependencies={[columns, renderCell, isMultiple, liveWidths, rowClassName]}
        >
          {(item) => (
            <HeroTable.Row id={item.id} className={rowClassName?.(item) ?? ""}>
              {isMultiple ? (
                <HeroTable.Cell
                  className="pe-0"
                  style={
                    startPins.length > 0
                      ? { position: "sticky", insetInlineStart: 0, zIndex: 1 }
                      : {}
                  }
                >
                  <SelectionCheckbox />
                </HeroTable.Cell>
              ) : null}
              <HeroTable.Collection items={columns} dependencies={[item, renderCell, liveWidths]}>
                {(column) => (
                  <HeroTable.Cell
                    className={ALIGN_CLASS[column.align ?? "start"]}
                    style={{ ...pinStyle(column), ...(column.pin ? { zIndex: 1 } : {}) }}
                  >
                    {column.wrap === undefined && !column.pin ? (
                      renderCell ? (
                        renderCell(item, column)
                      ) : (
                        cellTextOf(item, column.id)
                      )
                    ) : (
                      <span
                        className={wrapClass(column)}
                        style={
                          column.wrap === false && widthOf(column)
                            ? { maxInlineSize: (widthOf(column) ?? 0) - 32 }
                            : {}
                        }
                      >
                        {renderCell ? renderCell(item, column) : cellTextOf(item, column.id)}
                      </span>
                    )}
                    {pinShadow(column)}
                  </HeroTable.Cell>
                )}
              </HeroTable.Collection>
            </HeroTable.Row>
          )}
        </HeroTable.Collection>
        {isPaged ? (
          // Only the sentinel: React Aria's own loading row carries `aria-level`, which a grid refuses.
          // It fires as soon as the end is in view, so it is silent while a page is already coming.
          <HeroTable.LoadMore {...(isLoading ? {} : { onLoadMore })} />
        ) : null}
      </HeroTable.Body>
    </HeroTable.Content>
  );
  const loadingLine =
    isLoading && hasRows ? (
      // The words are the live status's below, so this line is for the eye alone.
      <div aria-hidden="true">
        <LoadingContent text={loadingText} />
      </div>
    ) : null;
  const scrollProps = {
    className: "group/scroll",
    ...(scroll.start ? { "data-scroll-start": "" } : {}),
    ...(scroll.end ? { "data-scroll-end": "" } : {}),
    onScroll,
    ...(isStickyHeader
      ? { style: { maxHeight: `round(down, ${maxHeight}, ${ROW_PX[density]}px)` } }
      : {}),
  };

  return (
    <HeroTable
      {...omitUndefined({ ...rest, variant })}
      aria-busy={isLoading || undefined}
      className={cn(DENSITY_CLASS[density], className)}
      style={{ minInlineSize: MIN_INLINE_SIZE, ...style }}
    >
      {isStoodIn ? (
        <div role="group" aria-label={label}>
          {standIn}
        </div>
      ) : isLaidOut ? (
        <HeroTable.ResizableContainer
          {...scrollProps}
          onResize={(widths) => {
            const next: Record<string, number> = {};
            for (const [key, value] of widths)
              if (typeof value === "number") next[String(key)] = value;
            setLiveWidths(next);
          }}
          onResizeEnd={(widths) => {
            for (const column of columns) {
              const value = widths.get(column.id);
              if (typeof value === "number" && value !== restingWidthOf(column))
                onColumnResize?.(column.id, value);
            }
            setLiveWidths({});
          }}
        >
          {content}
          {loadingLine}
        </HeroTable.ResizableContainer>
      ) : (
        <HeroTable.ScrollContainer {...scrollProps}>
          {content}
          {loadingLine}
        </HeroTable.ScrollContainer>
      )}
      {/* One live status, present before it speaks, so "Loading orders" is read once and not once per row. */}
      <div role="status" className="sr-only">
        {isLoading ? loadingText : ""}
      </div>
    </HeroTable>
  );
}
