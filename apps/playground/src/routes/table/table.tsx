/**
 * Stackra file contract:
 * Purpose: the page of the table route: the table in both variants with cells drawn by `renderCell`, a server-sorted
 *          table whose sort is the page's state, the three selection modes, a sticky header, the empty, first-load and
 *          reload states, and a live table that sorts, selects and loads more rows as the end is reached, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The "server" is a function of the
 *           page: it sorts a fixed list and hands back the first rows, as a cursor-paged query would, so the table
 *           itself never sorts or pages.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0313; ADR 0060 (light, dark, RTL).
 */
import type { SortDescriptor, TableColumn, Tone } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";

import { PageSection } from "#src/components/page-section";
import { TableRoute } from "#src/routes/table/table.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::table.*` keys.
const STRINGS = {
  documentTitle: `${TableRoute.title} · Stackra Playground`,
  intro:
    "A table shows rows against named columns. The rows are the page's items, each cell comes from the property its column names or from a renderer, and the sort and the selection belong to the page: the table reports what the user asked for and never reorders or pages what it was given. On a phone the same props draw a list of cards.",
  basics: "Basics",
  basicsNote:
    "The two variants. The status and the total are drawn by a cell renderer; the other cells show their property as text.",
  primary: "Orders, primary variant",
  secondary: "Orders, secondary variant",
  sorting: "Sorting",
  sortingNote:
    "A press on a sortable header asks for a sort. This page plays the server: it sorts its list and hands the table the rows in that order.",
  sortedLabel: "Orders, sorted by the server",
  sorted: (sort: SortDescriptor) => `Sorted by: ${sort.column}, ${sort.direction}`,
  selection: "Selection",
  selectionNote:
    "None is a plain table. One selects the pressed row. Several adds a box to each row and one to select all; each reports the ids selected.",
  none: "Orders, no selection",
  single: "Orders, one selected",
  multiple: "Orders, several selected",
  selected: (keys: readonly string[]) =>
    `Selected: ${keys.length === 0 ? "none" : keys.join(", ")}`,
  sticky: "Sticky header",
  stickyNote:
    "The header stays in view while the rows scroll inside a fixed height; the rows scroll, the page does not.",
  stickyLabel: "Orders, sticky header",
  states: "States",
  statesNote:
    "An empty table says why, a first load shows a spinner row in the rows' place, and a reload keeps the rows and adds a loading row after them. Loading is announced once.",
  emptyLabel: "Orders, empty",
  empty: "No orders match this filter.",
  loadingLabel: "Orders, loading",
  loadingText: "Loading orders",
  reloadingLabel: "Orders, reloading",
  live: "Try it",
  liveNote:
    "Sort a column, select rows and scroll the rows to their end: the next page loads when the end comes into view. Reset starts again.",
  liveLabel: "Orders, live",
  liveSort: (sort: SortDescriptor | undefined) =>
    sort ? `Sorted by: ${sort.column}, ${sort.direction}` : "Sorted by: none",
  liveLoaded: (loaded: number, all: number) => `Loaded ${loaded} of ${all} orders`,
  reset: "Reset",
  columnOrder: "Order",
  columnCustomer: "Customer",
  columnStatus: "Status",
  columnTotal: "Total",
  columnPlaced: "Placed",
} as const;

/** One order of the samples. */
interface Order {
  readonly id: string;
  readonly order: string;
  readonly customer: string;
  readonly status: "Paid" | "Pending" | "Refunded";
  readonly total: number;
  readonly placed: string;
}

const CUSTOMERS = ["Ada Lovelace", "Grace Hopper", "Linus Torvalds", "Margaret Hamilton"] as const;
const STATUSES = ["Paid", "Pending", "Refunded"] as const;

/** A fixed list of orders: the same rows on every load, so the samples and the tests agree. */
const ORDERS: readonly Order[] = Array.from({ length: 24 }, (_, index) => ({
  id: `ord-${1001 + index}`,
  order: `#${1001 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length] ?? "",
  status: STATUSES[index % STATUSES.length] ?? "Paid",
  total: ((index * 37) % 90) + 10,
  placed: `2026-10-${String((index % 28) + 1).padStart(2, "0")}`,
}));

/** The columns: every one sortable but the status. */
const COLUMNS: readonly TableColumn[] = [
  { id: "order", label: STRINGS.columnOrder, isSortable: true },
  { id: "customer", label: STRINGS.columnCustomer, isSortable: true },
  { id: "status", label: STRINGS.columnStatus },
  { id: "total", label: STRINGS.columnTotal, isSortable: true, align: "end" },
  { id: "placed", label: STRINGS.columnPlaced, isSortable: true },
];

/** The same columns without sorting, for the samples that do not sort. */
const PLAIN_COLUMNS: readonly TableColumn[] = COLUMNS.map((column) => ({
  id: column.id,
  label: column.label,
  ...(column.align ? { align: column.align } : {}),
}));

/** The tone of each status chip. */
const STATUS_TONE: Readonly<Record<Order["status"], Tone>> = Object.freeze({
  Paid: "success",
  Pending: "warning",
  Refunded: "default",
});

/** Fixed to US dollars in English, so the total reads the same in both reading directions. */
const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** The cell of a sample: the status as a chip and the total as money, the rest as the table's own text. */
function renderOrderCell(order: Order, column: TableColumn) {
  if (column.id === "status")
    return <Ui.Chip tone={STATUS_TONE[order.status]}>{order.status}</Ui.Chip>;
  if (column.id === "total") return <bdi>{MONEY.format(order.total)}</bdi>;
  return String(order[column.id as keyof Order]);
}

/**
 * The server: the orders sorted as asked. A table is handed the result and never sorts, so this is the page's job.
 * Ties keep the list's own order, which is stable.
 */
function sortedOrders(sort: SortDescriptor | undefined): readonly Order[] {
  if (!sort) return ORDERS;
  const key = sort.column as keyof Order;
  const factor = sort.direction === "ascending" ? 1 : -1;
  return [...ORDERS].sort((first, second) => {
    const a = first[key];
    const b = second[key];
    return (
      (typeof a === "number" && typeof b === "number"
        ? a - b
        : String(a).localeCompare(String(b))) * factor
    );
  });
}

/** How many rows a page of the live table adds. */
const PAGE_SIZE = 8;

/** The first rows of the sample lists. */
const FEW = ORDERS.slice(0, 5);

/** The grid that lays the samples out one under the other. */
const STACK = "grid gap-8";

/** The Table page. */
export function Table() {
  const [sort, setSort] = useState<SortDescriptor>({ column: "total", direction: "descending" });
  const [single, setSingle] = useState<readonly string[]>([]);
  const [multiple, setMultiple] = useState<readonly string[]>(["ord-1002"]);

  const [liveSort, setLiveSort] = useState<SortDescriptor | undefined>(undefined);
  const [liveSelected, setLiveSelected] = useState<readonly string[]>([]);
  const [count, setCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // A page that is still coming when the page unmounts must not set state on it.
  useEffect(() => () => clearTimeout(timer.current), []);
  const liveRows = sortedOrders(liveSort).slice(0, count);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{TableRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="table-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
        <div className={STACK}>
          <Ui.Table
            label={STRINGS.primary}
            items={FEW}
            columns={PLAIN_COLUMNS}
            renderCell={renderOrderCell}
          />
          <Ui.Table
            label={STRINGS.secondary}
            variant="secondary"
            items={FEW}
            columns={PLAIN_COLUMNS}
            renderCell={renderOrderCell}
          />
        </div>
      </PageSection>

      <PageSection id="table-sorting" title={STRINGS.sorting} note={STRINGS.sortingNote}>
        <Ui.Table
          label={STRINGS.sortedLabel}
          items={sortedOrders(sort).slice(0, 6)}
          columns={COLUMNS}
          renderCell={renderOrderCell}
          sortDescriptor={sort}
          onSortChange={setSort}
        />
        <Ui.Text role="status" data-testid="table-sort" tone="muted">
          {STRINGS.sorted(sort)}
        </Ui.Text>
      </PageSection>

      <PageSection id="table-selection" title={STRINGS.selection} note={STRINGS.selectionNote}>
        <div className={STACK}>
          <Ui.Table
            label={STRINGS.none}
            items={FEW}
            columns={PLAIN_COLUMNS}
            renderCell={renderOrderCell}
          />
          <Ui.Table
            label={STRINGS.single}
            items={FEW}
            columns={PLAIN_COLUMNS}
            renderCell={renderOrderCell}
            selectionMode="single"
            selectedKeys={single}
            onSelectionChange={setSingle}
          />
          <Ui.Text role="status" data-testid="table-selected-single" tone="muted">
            {STRINGS.selected(single)}
          </Ui.Text>
          <Ui.Table
            label={STRINGS.multiple}
            items={FEW}
            columns={PLAIN_COLUMNS}
            renderCell={renderOrderCell}
            selectionMode="multiple"
            selectedKeys={multiple}
            onSelectionChange={setMultiple}
          />
          <Ui.Text role="status" data-testid="table-selected-multiple" tone="muted">
            {STRINGS.selected(multiple)}
          </Ui.Text>
        </div>
      </PageSection>

      <PageSection id="table-sticky" title={STRINGS.sticky} note={STRINGS.stickyNote}>
        <Ui.Table
          label={STRINGS.stickyLabel}
          items={ORDERS.slice(0, 14)}
          columns={PLAIN_COLUMNS}
          renderCell={renderOrderCell}
          isStickyHeader
          maxHeight="14rem"
        />
      </PageSection>

      <PageSection id="table-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <div className={STACK}>
          <Ui.Table
            label={STRINGS.emptyLabel}
            items={[]}
            columns={PLAIN_COLUMNS}
            emptyState={<Ui.Text tone="muted">{STRINGS.empty}</Ui.Text>}
          />
          <Ui.Table
            label={STRINGS.loadingLabel}
            items={[]}
            columns={PLAIN_COLUMNS}
            isLoading
            loadingLabel={STRINGS.loadingText}
          />
          <Ui.Table
            label={STRINGS.reloadingLabel}
            items={FEW}
            columns={PLAIN_COLUMNS}
            renderCell={renderOrderCell}
            isLoading
            loadingLabel={STRINGS.loadingText}
          />
        </div>
      </PageSection>

      <PageSection id="table-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <Ui.Table
          label={STRINGS.liveLabel}
          items={liveRows}
          columns={COLUMNS}
          renderCell={renderOrderCell}
          sortDescriptor={liveSort}
          onSortChange={(next) => {
            // A new sort is a new query: it starts again from the first page.
            setLiveSort(next);
            setCount(PAGE_SIZE);
          }}
          selectionMode="multiple"
          selectedKeys={liveSelected}
          onSelectionChange={setLiveSelected}
          isStickyHeader
          maxHeight="14rem"
          isLoading={isLoadingMore}
          loadingLabel={STRINGS.loadingText}
          hasMore={count < ORDERS.length}
          onLoadMore={() => {
            setIsLoadingMore(true);
            timer.current = setTimeout(() => {
              setCount((current) => Math.min(current + PAGE_SIZE, ORDERS.length));
              setIsLoadingMore(false);
            }, 400);
          }}
        />
        <Ui.Text role="status" data-testid="table-live-sort" tone="muted">
          {STRINGS.liveSort(liveSort)}
        </Ui.Text>
        <Ui.Text role="status" data-testid="table-live-selected" tone="muted">
          {STRINGS.selected(liveSelected)}
        </Ui.Text>
        <Ui.Text data-testid="table-live-loaded" tone="muted">
          {STRINGS.liveLoaded(liveRows.length, ORDERS.length)}
        </Ui.Text>
        <div>
          <Ui.Button
            variant="secondary"
            onPress={() => {
              clearTimeout(timer.current);
              setIsLoadingMore(false);
              setLiveSort(undefined);
              setLiveSelected([]);
              setCount(PAGE_SIZE);
            }}
          >
            {STRINGS.reset}
          </Ui.Button>
        </div>
      </PageSection>
    </article>
  );
}
