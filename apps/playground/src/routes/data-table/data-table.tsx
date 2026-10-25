/**
 * Stackra file contract:
 * Purpose: the page of the data table route: the table in both variants; a server-sorted table whose sort lives in the
 *          resource query; row actions with a disabled one, a slow one and a failing one; a selection with the bulk
 *          bar, select all matching and a failing bulk action; the filter bar slot holding a search field; the empty,
 *          no-results, first-load, reload and error states; cursor paging; and a live table over a fake server that
 *          searches, sorts, pages, selects and acts, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The "server" is a function of
 *           the query: it filters and sorts a fixed list and hands back one cursor page, so the table itself never
 *           searches, sorts or pages. A failing action rejects on purpose, to show that the selection is left as it was.
 *           Its timers are short and are not awaited by the page, so nothing runs after the page is gone.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0313; ADR 0318 (decisions 2 and 4 to 6);
 *          ADR 0060 (light, dark, RTL).
 */
import type {
  ResourceAction,
  ResourceQuery,
  SortDescriptor,
  TableColumn,
  Tone,
} from "@stackra/ui/contracts";
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { Ellipsis } from "@stackra/icons/react/lucide-icons";
import * as Ui from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { DataTableRoute } from "#src/routes/data-table/data-table.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::data-table.*` keys.
const STRINGS = {
  documentTitle: `${DataTableRoute.title} · Stackra Playground`,
  intro:
    "A data table is a resource index: a table of rows with the search, filters and sort that fetched them, a menu of actions on each row, a bar of actions on a selection, and a state for every way the list can be empty or fail. It holds no query and fetches nothing: the page owns the query, and each press asks for the next one. On a phone the same props draw a list of cards with a bottom bar for the selection.",
  basics: "Basics",
  basicsNote:
    "The two variants of the table it is built on, with the cells of the page's own renderer.",
  primary: "Orders, primary variant",
  secondary: "Orders, secondary variant",
  sorting: "Sorting",
  sortingNote:
    "The sort is part of the query. A press on a sortable header calls onQueryChange with the whole next query, and this page plays the server and hands back the rows in that order.",
  sortedLabel: "Orders, sorted by the server",
  sorted: (sort: SortDescriptor | null) =>
    sort ? `Sorted by: ${sort.column}, ${sort.direction}` : "Sorted by: none",
  rowActions: "Row actions",
  rowActionsNote:
    "Each row has a menu named for it. Archive takes a moment and shows itself working, Delete fails, and Refund is refused for an order that is not paid, with its reason.",
  rowActionsLabel: "Orders, with row actions",
  lastAction: (text: string) => `Last action: ${text}`,
  none: "none",
  selection: "Selection and the bulk bar",
  selectionNote:
    "Several selected rows bring up the bar with their count. When every row on screen is selected, the bar offers all matching records, which the server counts. Archive succeeds and clears the selection; Delete fails and leaves it as it was.",
  selectionLabel: "Orders, several selected",
  selected: (keys: readonly string[]) =>
    `Selected: ${keys.length === 0 ? "none" : keys.join(", ")}`,
  allMatching: (isAll: boolean) => `All matching: ${isAll ? "yes" : "no"}`,
  filterSlot: "Filter bar slot",
  filterSlotNote:
    "The table draws any node above its rows. Here it is a search field that writes to the same query; the FilterBar component goes in the same place.",
  filterSlotLabel: "Orders, with a search above",
  searchLabel: "Search the orders",
  query: (query: ResourceQuery) => `Search: ${query.search === "" ? "none" : query.search}`,
  states: "States",
  statesNote:
    "Nothing here yet, no result for a search, a first load, a reload that keeps the rows, and a failed load with a retry.",
  emptyLabel: "Orders, empty",
  noResultsLabel: "Orders, no results",
  firstLoadLabel: "Orders, first load",
  reloadLabel: "Orders, reloading",
  errorLabel: "Orders, failed",
  loadingText: "Loading orders",
  failure: "The order service did not answer.",
  paging: "Cursor paging",
  pagingNote:
    "Previous and next ask for a cursor page; there is no page number and no total. The pager appears only when the page gives a handler.",
  pagingLabel: "Orders, paged",
  cursor: (cursor: number) => `Cursor: ${cursor}`,
  live: "Try it",
  liveNote:
    "A fake server with 24 orders in pages of five. Search, sort, page, select rows and run an action; every change of the query returns to the first page and clears the selection.",
  liveLabel: "Orders, live",
  liveSearch: "Search the live orders",
  simulateError: "Simulate a failed load",
  recover: "Recover",
  matching: (count: number) => `Matching: ${count}`,
  open: "Open",
  archive: "Archive",
  delete: "Delete",
  refund: "Refund",
  refundReason: "Only paid orders can be refunded",
  failed: (name: string) => `${name} failed`,
  done: (name: string) => `${name} done`,
  columnOrder: "Order",
  columnCustomer: "Customer",
  columnStatus: "Status",
  columnTotal: "Total",
} as const;

/** One order of the samples. */
interface Order {
  readonly id: string;
  readonly order: string;
  readonly customer: string;
  readonly status: "Paid" | "Pending" | "Refunded";
  readonly total: number;
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
}));

/** The columns: every one sortable but the status. */
const COLUMNS: readonly TableColumn[] = [
  { id: "order", label: STRINGS.columnOrder, isSortable: true },
  { id: "customer", label: STRINGS.columnCustomer, isSortable: true },
  { id: "status", label: STRINGS.columnStatus },
  { id: "total", label: STRINGS.columnTotal, isSortable: true, align: "end" },
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

/** The one icon the page draws beyond the playground's own: the ellipsis of each row's menu button. */
const PAGE_ICONS = defineIconRegistry({ ellipsis: Ellipsis });

/** The query with nothing set. */
const NO_QUERY: ResourceQuery = Object.freeze({ search: "", filterValues: {}, sort: null });

/** How many rows a page of the live table holds. */
const PAGE_SIZE = 5;

/** How long a fake action or page takes, so a busy state can be seen and tested. */
const DELAY = 500;

/** How long the slow row action takes: long enough for a busy e2e runner to reopen the menu and see it working. */
const SLOW_ACTION = 2_000;

/** Does nothing: a sample whose query never changes. */
const ignore = () => undefined;

/** Waits for `ms` milliseconds. */
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** The cell of a sample: the status as a chip and the total as money, the rest as the table's own text. */
function renderOrderCell(order: Order, column: TableColumn) {
  if (column.id === "status")
    return <Ui.Chip tone={STATUS_TONE[order.status]}>{order.status}</Ui.Chip>;
  if (column.id === "total") return <bdi>{MONEY.format(order.total)}</bdi>;
  return <bdi>{String(order[column.id as keyof Order])}</bdi>;
}

/**
 * The server: the orders that match the search, sorted as asked. A table is handed the result and never filters or
 * sorts, so this is the page's job. Ties keep the list's own order, which is stable.
 */
function ordersFor(query: ResourceQuery): readonly Order[] {
  const needle = query.search.trim().toLowerCase();
  const found = ORDERS.filter(
    (order) =>
      needle === "" ||
      order.order.toLowerCase().includes(needle) ||
      order.customer.toLowerCase().includes(needle),
  );
  if (!query.sort) return found;
  const key = query.sort.column as keyof Order;
  const factor = query.sort.direction === "ascending" ? 1 : -1;
  return [...found].sort((first, second) => {
    const a = first[key];
    const b = second[key];
    return (
      (typeof a === "number" && typeof b === "number"
        ? a - b
        : String(a).localeCompare(String(b))) * factor
    );
  });
}

/** The first rows of the sample lists. */
const FEW = ORDERS.slice(0, 5);

/** The grid that lays the samples out one under the other. */
const STACK = "grid gap-8";

/** A captioned sample: a small heading over what it shows. */
function Sample({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Ui.Heading level={3}>{title}</Ui.Heading>
      {children}
    </div>
  );
}

/** A sample table with the common props of the page's static samples. */
function Static(props: Partial<Ui.DataTableProps<Order>> & { readonly label: string }) {
  return (
    <Ui.DataTable
      items={FEW}
      columns={PLAIN_COLUMNS}
      renderCell={renderOrderCell}
      query={NO_QUERY}
      onQueryChange={ignore}
      headingLevel={4}
      {...props}
    />
  );
}

/** The row actions of the samples: one that works, one that takes a moment, one that fails, one refused. */
function rowActionsOf(report: (text: string) => void) {
  return (order: Order): readonly ResourceAction[] => [
    { id: "open", label: STRINGS.open, onPress: () => report(`${STRINGS.open} ${order.order}`) },
    {
      id: "archive",
      label: STRINGS.archive,
      onPress: async () => {
        await delay(SLOW_ACTION);
        report(STRINGS.done(`${STRINGS.archive} ${order.order}`));
      },
    },
    {
      id: "refund",
      label: STRINGS.refund,
      isDisabled: order.status !== "Paid",
      disabledReason: STRINGS.refundReason,
      onPress: () => report(`${STRINGS.refund} ${order.order}`),
    },
    {
      id: "delete",
      label: STRINGS.delete,
      tone: "danger",
      onPress: async () => {
        await delay(DELAY);
        report(STRINGS.failed(`${STRINGS.delete} ${order.order}`));
        throw new Error(STRINGS.failure);
      },
    },
  ];
}

/** The bulk actions of the samples: one that succeeds and clears, and one that fails and leaves the selection. */
function bulkActionsOf(
  report: (text: string) => void,
  clear: () => void,
): readonly ResourceAction[] {
  return [
    {
      id: "archive",
      label: STRINGS.archive,
      onPress: async () => {
        await delay(DELAY);
        report(STRINGS.done(STRINGS.archive));
        clear();
      },
    },
    {
      id: "delete",
      label: STRINGS.delete,
      tone: "danger",
      onPress: async () => {
        await delay(DELAY);
        report(STRINGS.failed(STRINGS.delete));
        throw new Error(STRINGS.failure);
      },
    },
  ];
}

/** A table whose sort lives in the page's query, the page playing the server. */
function SortingExample() {
  const [query, setQuery] = useState<ResourceQuery>({
    ...NO_QUERY,
    sort: { column: "total", direction: "descending" },
  });
  return (
    <>
      <Ui.DataTable
        label={STRINGS.sortedLabel}
        items={ordersFor(query).slice(0, 6)}
        columns={COLUMNS}
        renderCell={renderOrderCell}
        query={query}
        onQueryChange={setQuery}
      />
      <Ui.Text role="status" data-testid="data-table-sort" tone="muted">
        {STRINGS.sorted(query.sort)}
      </Ui.Text>
    </>
  );
}

/** A table with a menu of actions on each row, and the last action named under it. */
function RowActionsExample() {
  const [last, setLast] = useState<string>(STRINGS.none);
  return (
    <>
      <Static label={STRINGS.rowActionsLabel} rowActions={rowActionsOf(setLast)} headingLevel={3} />
      <Ui.Text role="status" data-testid="data-table-last-action" tone="muted">
        {STRINGS.lastAction(last)}
      </Ui.Text>
    </>
  );
}

/** A table of several selectable rows with the bulk bar and select all matching. */
function SelectionExample() {
  const [selected, setSelected] = useState<readonly string[]>(["ord-1001", "ord-1002"]);
  const [isAll, setIsAll] = useState(false);
  const [last, setLast] = useState<string>(STRINGS.none);
  return (
    <>
      <Static
        label={STRINGS.selectionLabel}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        bulkActions={bulkActionsOf(setLast, () => {
          setSelected([]);
          setIsAll(false);
        })}
        totalCount={ORDERS.length}
        isAllMatchingSelected={isAll}
        onAllMatchingSelectedChange={setIsAll}
      />
      <Ui.Text role="status" data-testid="data-table-selected" tone="muted">
        {STRINGS.selected(selected)}
      </Ui.Text>
      <Ui.Text role="status" data-testid="data-table-all-matching" tone="muted">
        {STRINGS.allMatching(isAll)}
      </Ui.Text>
      <Ui.Text role="status" data-testid="data-table-bulk-action" tone="muted">
        {STRINGS.lastAction(last)}
      </Ui.Text>
    </>
  );
}

/** A table with a search field in the filter bar slot, writing to the same query. */
function FilterSlotExample() {
  const [query, setQuery] = useState<ResourceQuery>(NO_QUERY);
  return (
    <>
      <Ui.DataTable
        label={STRINGS.filterSlotLabel}
        items={ordersFor(query).slice(0, 5)}
        columns={PLAIN_COLUMNS}
        renderCell={renderOrderCell}
        query={query}
        onQueryChange={setQuery}
        headingLevel={3}
        filterBar={
          <Ui.SearchField
            aria-label={STRINGS.searchLabel}
            value={query.search}
            onChange={(search) => setQuery({ ...query, search })}
          />
        }
      />
      <Ui.Text role="status" data-testid="data-table-slot-query" tone="muted">
        {STRINGS.query(query)}
      </Ui.Text>
    </>
  );
}

/** A table that pages by cursor over the fake server. */
function PagingExample() {
  const [cursor, setCursor] = useState(0);
  const [history, setHistory] = useState<readonly number[]>([]);
  const rows = ORDERS.slice(cursor, cursor + PAGE_SIZE);
  const next = cursor + PAGE_SIZE;
  return (
    <>
      <Static
        label={STRINGS.pagingLabel}
        items={rows}
        headingLevel={3}
        hasMore={next < ORDERS.length}
        hasPrevious={history.length > 0}
        onNext={() => {
          setHistory([...history, cursor]);
          setCursor(next);
        }}
        onPrevious={() => {
          setCursor(history.at(-1) ?? 0);
          setHistory(history.slice(0, -1));
        }}
      />
      <Ui.Text data-testid="data-table-cursor" tone="muted">
        <bdi>{STRINGS.cursor(cursor)}</bdi>
      </Ui.Text>
    </>
  );
}

/** The live table: a fake server that searches, sorts and pages, with selection and actions on top. */
function LiveExample() {
  const [query, setQuery] = useState<ResourceQuery>(NO_QUERY);
  const [cursor, setCursor] = useState(0);
  const [history, setHistory] = useState<readonly number[]>([]);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [isAll, setIsAll] = useState(false);
  const [isFailing, setIsFailing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [last, setLast] = useState<string>(STRINGS.none);

  const found = ordersFor(query);
  const rows = found.slice(cursor, cursor + PAGE_SIZE);
  const next = cursor + PAGE_SIZE;

  /** Any new query starts again from the first page with nothing selected. */
  const change = (to: ResourceQuery) => {
    setQuery(to);
    setCursor(0);
    setHistory([]);
    setSelected([]);
    setIsAll(false);
  };

  /** A page that takes a moment, so its loading state is seen. */
  const go = async (to: number, kept: readonly number[]) => {
    setIsLoading(true);
    await delay(DELAY);
    setCursor(to);
    setHistory(kept);
    setSelected([]);
    setIsAll(false);
    setIsLoading(false);
  };

  return (
    <>
      <Ui.DataTable
        label={STRINGS.liveLabel}
        items={rows}
        columns={COLUMNS}
        renderCell={renderOrderCell}
        query={query}
        onQueryChange={change}
        headingLevel={3}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        rowActions={rowActionsOf(setLast)}
        bulkActions={bulkActionsOf(setLast, () => {
          setSelected([]);
          setIsAll(false);
        })}
        totalCount={found.length}
        isAllMatchingSelected={isAll}
        onAllMatchingSelectedChange={setIsAll}
        isLoading={isLoading}
        loadingLabel={STRINGS.loadingText}
        hasMore={next < found.length}
        hasPrevious={history.length > 0}
        onNext={() => void go(next, [...history, cursor])}
        onPrevious={() => void go(history.at(-1) ?? 0, history.slice(0, -1))}
        error={isFailing ? new Error(STRINGS.failure) : undefined}
        isMessageShown
        onRetry={() => setIsFailing(false)}
        filterBar={
          <Ui.SearchField
            aria-label={STRINGS.liveSearch}
            value={query.search}
            onChange={(search) => change({ ...query, search })}
          />
        }
      />
      <Ui.Text role="status" data-testid="data-table-live-query" tone="muted">
        {STRINGS.query(query)} · {STRINGS.sorted(query.sort)}
      </Ui.Text>
      <Ui.Text role="status" data-testid="data-table-live-selected" tone="muted">
        {STRINGS.selected(selected)}
      </Ui.Text>
      <Ui.Text role="status" data-testid="data-table-live-last" tone="muted">
        {STRINGS.lastAction(last)}
      </Ui.Text>
      <Ui.Text data-testid="data-table-live-matching" tone="muted">
        {STRINGS.matching(found.length)}
      </Ui.Text>
      <div>
        <Ui.Button variant="secondary" onPress={() => setIsFailing((current) => !current)}>
          {isFailing ? STRINGS.recover : STRINGS.simulateError}
        </Ui.Button>
      </div>
    </>
  );
}

/** The DataTable page. */
export function DataTable() {
  return (
    <IconRegistryProvider registry={PAGE_ICONS}>
      <article className="grid gap-10">
        <title>{STRINGS.documentTitle}</title>
        <header className="grid gap-2">
          <Ui.Heading level={1}>{DataTableRoute.title}</Ui.Heading>
          <Ui.Text className="max-w-prose">
            <bdi>{STRINGS.intro}</bdi>
          </Ui.Text>
        </header>

        <PageSection id="data-table-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
          <div className={STACK}>
            <Static label={STRINGS.primary} headingLevel={3} />
            <Static label={STRINGS.secondary} variant="secondary" headingLevel={3} />
          </div>
        </PageSection>

        <PageSection id="data-table-sorting" title={STRINGS.sorting} note={STRINGS.sortingNote}>
          <SortingExample />
        </PageSection>

        <PageSection
          id="data-table-row-actions"
          title={STRINGS.rowActions}
          note={STRINGS.rowActionsNote}
        >
          <RowActionsExample />
        </PageSection>

        <PageSection
          id="data-table-selection"
          title={STRINGS.selection}
          note={STRINGS.selectionNote}
        >
          <SelectionExample />
        </PageSection>

        <PageSection
          id="data-table-filter-slot"
          title={STRINGS.filterSlot}
          note={STRINGS.filterSlotNote}
        >
          <FilterSlotExample />
        </PageSection>

        <PageSection id="data-table-states" title={STRINGS.states} note={STRINGS.statesNote}>
          <div className={STACK}>
            <Sample title={STRINGS.emptyLabel}>
              <Static label={STRINGS.emptyLabel} items={[]} />
            </Sample>
            <Sample title={STRINGS.noResultsLabel}>
              <Static
                label={STRINGS.noResultsLabel}
                items={[]}
                query={{ ...NO_QUERY, search: "zzz" }}
              />
            </Sample>
            <Sample title={STRINGS.firstLoadLabel}>
              <Static
                label={STRINGS.firstLoadLabel}
                items={[]}
                isLoading
                loadingLabel={STRINGS.loadingText}
              />
            </Sample>
            <Sample title={STRINGS.reloadLabel}>
              <Static label={STRINGS.reloadLabel} isLoading loadingLabel={STRINGS.loadingText} />
            </Sample>
            <Sample title={STRINGS.errorLabel}>
              <Static
                label={STRINGS.errorLabel}
                error={new Error(STRINGS.failure)}
                isMessageShown
                onRetry={ignore}
              />
            </Sample>
          </div>
        </PageSection>

        <PageSection id="data-table-paging" title={STRINGS.paging} note={STRINGS.pagingNote}>
          <PagingExample />
        </PageSection>

        <PageSection id="data-table-live" title={STRINGS.live} note={STRINGS.liveNote}>
          <LiveExample />
        </PageSection>
      </article>
    </IconRegistryProvider>
  );
}
