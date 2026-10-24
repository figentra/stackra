/**
 * Stackra file contract:
 * Purpose: the web `Table` on HeroUI v3's Table (React Aria): draws the shared contract (`items`, `columns`,
 *          `renderCell`, `selectionMode`, the selected ids, the controlled sort, `emptyState`, `isLoading`, `hasMore`,
 *          `onLoadMore`, the sticky header and `variant`) as HeroUI's scroll container, header, sortable column
 *          headers, rows and cells, reports the selection as a list of ids, and passes every other `div` prop to the
 *          table's root.
 * Boundary: no styling of its own beyond the utility classes that pin a sticky header and line a column's text up. The
 *           table never sorts or pages the rows it is given: the sort is controlled and `onLoadMore` only asks. HeroUI
 *           draws no selection column, so a multiple selection adds the documented checkbox column (React Aria names
 *           each box and the select-all one), and a single selection selects the row on press with no column. Empty and
 *           loading are two states: `emptyState` shows only when nothing loads, and `isLoading` shows a spinner row and
 *           says `loadingLabel` once through a status region, not once per row. HeroUI's table has no read-only or
 *           disabled state, so the contract has none.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0303 (decision 7); ADR 0313;
 *          WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2, 4.1.3; owner decision 6 of STA-350 (thin wrappers).
 */
import { Checkbox as HeroCheckbox, Table as HeroTable } from "@heroui/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import type { TableContractProps } from "#contracts/types/table-contract-props.type";
import { cellTextOf } from "#core/functions/cell-text-of.function";
import { keysOfSelection } from "#core/functions/keys-of-selection.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Spinner } from "#react/spinner/spinner";

/**
 * Props of the web Table: the shared contract plus the `div` props of HeroUI's table root, passed through unchanged
 * (a `className`, a `data-*` attribute, an `id`). The app lists rows as `items` and cells as `renderCell`, so
 * children are refused.
 */
export type TableProps<TItem extends CollectionItem = CollectionItem> = TableContractProps<TItem> &
  Omit<ComponentPropsWithoutRef<"div">, keyof TableContractProps | "children">;

// shortcut: English until @stackra/i18n ships; then the keys `ui::table.loading` and `ui::table.selection-column`.
const STRINGS = { loading: "Loading", selectionColumn: "Selection" } as const;

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
  onSortChange,
  emptyState,
  isLoading = false,
  loadingLabel,
  hasMore = false,
  onLoadMore,
  isStickyHeader = false,
  maxHeight = "24rem",
  ...rest
}: TableProps<TItem>) {
  const isMultiple = selectionMode === "multiple";
  const loadingText = loadingLabel ?? STRINGS.loading;
  // React Aria wants one row header, whose cell names the row; the first column is it unless the app picked one.
  const rowHeaderId = (columns.find((column) => column.isRowHeader) ?? columns[0])?.id;
  const hasEmptyState = emptyState !== undefined && emptyState !== null && emptyState !== false;
  const isPaged = hasMore && onLoadMore !== undefined;
  // A reload over rows that exist shows its spinner after them; a first load shows it in place of the empty state.
  const showsLoadMore = isPaged || (isLoading && items.length > 0);
  const headerClass = (column: TableColumn) =>
    [isStickyHeader ? STICKY_CLASS : "", ALIGN_CLASS[column.align ?? "start"]]
      .filter(Boolean)
      .join(" ");
  const renderEmpty = (): ReactNode =>
    isLoading ? <LoadingContent text={loadingText} /> : emptyState;

  return (
    <HeroTable {...rest} {...omitUndefined({ variant })} aria-busy={isLoading || undefined}>
      <HeroTable.ScrollContainer {...(isStickyHeader ? { style: { maxHeight } } : {})}>
        <HeroTable.Content
          aria-label={label}
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
          {...(sortDescriptor ? { sortDescriptor } : {})}
          onSortChange={(sort) =>
            onSortChange?.({ column: String(sort.column), direction: sort.direction })
          }
        >
          <HeroTable.Header>
            {isMultiple ? (
              <HeroTable.Column className={`w-10 pe-0 ${isStickyHeader ? STICKY_CLASS : ""}`}>
                {/* The box names itself; the text keeps the header from being an empty one for a checker. */}
                <span className="sr-only">{STRINGS.selectionColumn}</span>
                <SelectionCheckbox />
              </HeroTable.Column>
            ) : null}
            <HeroTable.Collection items={columns}>
              {(column) => (
                <HeroTable.Column
                  id={column.id}
                  isRowHeader={column.id === rowHeaderId}
                  allowsSorting={column.isSortable === true}
                  className={headerClass(column)}
                >
                  {({ sortDirection }) =>
                    column.isSortable ? (
                      <HeroTable.SortableColumnHeader
                        {...(sortDirection ? { sortDirection } : {})}
                        className={HEADER_ALIGN_CLASS[column.align ?? "start"]}
                      >
                        {column.label}
                      </HeroTable.SortableColumnHeader>
                    ) : (
                      column.label
                    )
                  }
                </HeroTable.Column>
              )}
            </HeroTable.Collection>
          </HeroTable.Header>
          <HeroTable.Body
            {...(isLoading || hasEmptyState ? { renderEmptyState: renderEmpty } : {})}
          >
            <HeroTable.Collection items={items} dependencies={[columns, renderCell, isMultiple]}>
              {(item) => (
                <HeroTable.Row id={item.id}>
                  {isMultiple ? (
                    <HeroTable.Cell className="pe-0">
                      <SelectionCheckbox />
                    </HeroTable.Cell>
                  ) : null}
                  <HeroTable.Collection items={columns} dependencies={[item, renderCell]}>
                    {(column) => (
                      <HeroTable.Cell className={ALIGN_CLASS[column.align ?? "start"]}>
                        {renderCell ? renderCell(item, column) : cellTextOf(item, column.id)}
                      </HeroTable.Cell>
                    )}
                  </HeroTable.Collection>
                </HeroTable.Row>
              )}
            </HeroTable.Collection>
            {showsLoadMore ? (
              <HeroTable.LoadMore
                isLoading={isLoading}
                // The sentinel fires as soon as the end is in view, so it is silent while a page is already coming.
                {...(isPaged && !isLoading ? { onLoadMore } : {})}
              >
                <HeroTable.LoadMoreContent>
                  <Spinner size="sm" />
                  <span>{loadingText}</span>
                </HeroTable.LoadMoreContent>
              </HeroTable.LoadMore>
            ) : null}
          </HeroTable.Body>
        </HeroTable.Content>
      </HeroTable.ScrollContainer>
      {/* One live status, present before it speaks, so "Loading orders" is read once and not once per row. */}
      <div role="status" className="sr-only">
        {isLoading ? loadingText : ""}
      </div>
    </HeroTable>
  );
}
