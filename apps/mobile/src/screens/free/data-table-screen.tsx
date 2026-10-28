/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `DataTable` (@stackra/ui): a resource index of cards over local
 *          rows, a menu of actions on each row (one slow, one refused, one that fails), several rows selected with the
 *          bulk bar and "select all matching", the states around the rows (empty, no results, first load, reload and
 *          failed), and a live table whose search, sort, cursor page and selection the page answers itself.
 * Boundary: presentation and local demo state only; the table is @stackra/ui's, nothing here is styled by hand. The
 *          table holds no query and fetches nothing: the page owns the query and plays the server, filtering and
 *          sorting a fixed list and handing back one page. A failing action rejects on purpose, to show that the
 *          selection is left as it was; the actions' timers only resolve a promise, so nothing runs against the page
 *          after it is gone. Every table passes `scrollEnabled={false}`: the page scrolls, so its rows must not.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import type { Tone } from "@stackra/contracts";
import type { ResourceAction, ResourceQuery, TableColumn } from "@stackra/ui/contracts";
import { Button, Chip, DataTable, SearchField, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description:
      "Each row is a card; the query that fetched the rows is the page's, so the table asks for the next one.",
    label: "Orders",
  },
  rowActions: {
    title: "Row actions",
    description:
      "Each row has a menu named for it. Archive takes a moment and shows itself working, Refund is refused for an order that is not paid, with its reason, and Delete fails.",
    label: "Orders, with row actions",
    last: (text: string | null) => `Last action: ${text ?? "none"}`,
  },
  selection: {
    title: "Selection and the bulk bar",
    description:
      "Several selected rows bring up the bar with their count. When every row on screen is selected, the bar offers all matching records. Archive succeeds and clears the selection; Delete fails and leaves it as it was.",
    label: "Orders, several selected",
    selected: (keys: readonly string[]) =>
      `Selected: ${keys.length === 0 ? "none" : keys.join(", ")}`,
    allMatching: (isAll: boolean) => `All matching: ${isAll ? "yes" : "no"}`,
  },
  states: {
    title: "States",
    description:
      "Nothing here yet, no result for a search, a first load, a reload that keeps the rows, and a failed load with a retry.",
    emptyLabel: "Orders, empty",
    noResultsLabel: "Orders, no results",
    firstLoadLabel: "Orders, first load",
    reloadLabel: "Orders, reloading",
    searchAgain: "Search for something that matches nothing again",
    errorLabel: "Orders, failed",
    loading: "Loading orders",
    failure: "The order service did not answer.",
    retries: (count: number) => `Retried ${count} ${count === 1 ? "time" : "times"}.`,
  },
  live: {
    title: "Try it",
    description:
      "A pretend server with 12 orders in pages of four. Search, sort, page, select rows and run an action; every change of the query goes back to the first page and clears the selection.",
    label: "Orders, live",
    search: "Search the orders",
    matching: (count: number) => `Matching orders: ${count}`,
    reset: "Reset the search and the sort",
  },
  actions: {
    open: "Open",
    archive: "Archive",
    delete: "Delete",
    refund: "Refund",
    refundReason: "Only paid orders can be refunded.",
    failed: (name: string) => `${name} failed`,
    done: (name: string) => `${name} done`,
  },
  columns: {
    order: "Order",
    customer: "Customer",
    status: "Status",
    total: "Total",
  },
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

/** A fixed list of orders: the same rows on every load. */
const ORDERS: readonly Order[] = Array.from({ length: 12 }, (_, index) => ({
  id: `ord-${1001 + index}`,
  order: `#${1001 + index}`,
  customer: CUSTOMERS[index % CUSTOMERS.length] ?? "",
  status: STATUSES[index % STATUSES.length] ?? "Paid",
  total: ((index * 37) % 90) + 10,
}));

/** The columns of the plain samples. */
const PLAIN_COLUMNS: readonly TableColumn[] = [
  { id: "order", label: STRINGS.columns.order },
  { id: "customer", label: STRINGS.columns.customer },
  { id: "status", label: STRINGS.columns.status },
  { id: "total", label: STRINGS.columns.total },
];

/** The columns of the live table: every one but the status can be sorted. */
const SORTABLE_COLUMNS: readonly TableColumn[] = PLAIN_COLUMNS.map((column) => ({
  ...column,
  isSortable: column.id !== "status",
}));

/** The tone of each status chip. */
const STATUS_TONE: Readonly<Record<Order["status"], Tone>> = Object.freeze({
  Paid: "success",
  Pending: "warning",
  Refunded: "default",
});

/** Fixed to US dollars in English, so a total reads the same in both reading directions. */
const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** The query with nothing set. */
const NO_QUERY: ResourceQuery = Object.freeze({ search: "", filterValues: {}, sort: null });

/** A search no order matches, for the no-results sample. */
const NO_RESULTS_QUERY: ResourceQuery = Object.freeze({
  search: "zzz",
  filterValues: {},
  sort: null,
});

/** How many rows a page of the live table holds. */
const PAGE_SIZE = 4;

/** How long a pretend action takes, so a busy state can be seen. */
const DELAY = 700;

/** Does nothing: a sample whose query never changes. */
const ignore = () => undefined;

/** Waits for `ms` milliseconds. */
const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** The cell of every sample: the status as a chip, the total as money, the rest as the table's own text. */
function renderOrderCell(order: Order, column: TableColumn) {
  if (column.id === "status") {
    return (
      <Chip size="sm" tone={STATUS_TONE[order.status]}>
        {order.status}
      </Chip>
    );
  }
  if (column.id === "total") return MONEY.format(order.total);
  return order[column.id as "order" | "customer"];
}

/**
 * The server: the orders that match the search, sorted as asked. The table is handed the result and never filters or
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
  const key = query.sort.column as "order" | "customer" | "total";
  const factor = query.sort.direction === "ascending" ? 1 : -1;
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return [...found].sort((first, second) => {
    const a = first[key];
    const b = second[key];
    const order =
      typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
    return order * factor;
  });
}

/** The row actions of the samples: one that works, one that takes a moment, one refused, one that fails. */
function rowActionsOf(report: (text: string) => void) {
  return (order: Order): readonly ResourceAction[] => [
    {
      id: "open",
      label: STRINGS.actions.open,
      onPress: () => report(`${STRINGS.actions.open} ${order.order}`),
    },
    {
      id: "archive",
      label: STRINGS.actions.archive,
      onPress: async () => {
        await delay(DELAY);
        report(STRINGS.actions.done(`${STRINGS.actions.archive} ${order.order}`));
      },
    },
    {
      id: "refund",
      label: STRINGS.actions.refund,
      isDisabled: order.status !== "Paid",
      disabledReason: STRINGS.actions.refundReason,
      onPress: () => report(`${STRINGS.actions.refund} ${order.order}`),
    },
    {
      id: "delete",
      label: STRINGS.actions.delete,
      tone: "danger",
      onPress: async () => {
        await delay(DELAY);
        report(STRINGS.actions.failed(`${STRINGS.actions.delete} ${order.order}`));
        throw new Error(STRINGS.states.failure);
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
      label: STRINGS.actions.archive,
      onPress: async () => {
        await delay(DELAY);
        report(STRINGS.actions.done(STRINGS.actions.archive));
        clear();
      },
    },
    {
      id: "delete",
      label: STRINGS.actions.delete,
      tone: "danger",
      onPress: async () => {
        await delay(DELAY);
        report(STRINGS.actions.failed(STRINGS.actions.delete));
        throw new Error(STRINGS.states.failure);
      },
    },
  ];
}

/** A table of the first rows with a menu of actions on each, the last action named under it. */
function RowActionsSample() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <>
      <DataTable
        scrollEnabled={false}
        label={STRINGS.rowActions.label}
        items={ORDERS.slice(0, 3)}
        columns={PLAIN_COLUMNS}
        renderCell={renderOrderCell}
        query={NO_QUERY}
        onQueryChange={ignore}
        rowActions={rowActionsOf(setLast)}
        headingLevel={4}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {STRINGS.rowActions.last(last)}
      </Text>
    </>
  );
}

/** A table of several selectable rows with the bulk bar and "select all matching". */
function SelectionSample() {
  const [selected, setSelected] = useState<readonly string[]>(["ord-1001", "ord-1002"]);
  const [isAll, setIsAll] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const rows = ORDERS.slice(0, 3);
  return (
    <>
      <DataTable
        scrollEnabled={false}
        label={STRINGS.selection.label}
        items={rows}
        columns={PLAIN_COLUMNS}
        renderCell={renderOrderCell}
        query={NO_QUERY}
        onQueryChange={ignore}
        headingLevel={4}
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
      <Text tone="muted" accessibilityLiveRegion="polite">
        {STRINGS.selection.selected(selected)}
      </Text>
      <Text tone="muted">{STRINGS.selection.allMatching(isAll)}</Text>
      <Text tone="muted">{STRINGS.rowActions.last(last)}</Text>
    </>
  );
}

/** The samples of the states around the rows. */
function StatesSample() {
  const [query, setQuery] = useState<ResourceQuery>(NO_RESULTS_QUERY);
  const [retries, setRetries] = useState(0);
  return (
    <>
      <DataTable
        scrollEnabled={false}
        label={STRINGS.states.emptyLabel}
        items={[]}
        columns={PLAIN_COLUMNS}
        query={NO_QUERY}
        onQueryChange={ignore}
        headingLevel={4}
      />
      <DataTable
        scrollEnabled={false}
        label={STRINGS.states.noResultsLabel}
        items={[]}
        columns={PLAIN_COLUMNS}
        query={query}
        onQueryChange={setQuery}
        headingLevel={4}
      />
      <Button size="sm" variant="tertiary" onPress={() => setQuery(NO_RESULTS_QUERY)}>
        {STRINGS.states.searchAgain}
      </Button>
      <DataTable
        scrollEnabled={false}
        label={STRINGS.states.firstLoadLabel}
        items={[]}
        columns={PLAIN_COLUMNS}
        query={NO_QUERY}
        onQueryChange={ignore}
        isLoading
        loadingLabel={STRINGS.states.loading}
      />
      <DataTable
        scrollEnabled={false}
        label={STRINGS.states.reloadLabel}
        items={ORDERS.slice(0, 2)}
        columns={PLAIN_COLUMNS}
        renderCell={renderOrderCell}
        query={NO_QUERY}
        onQueryChange={ignore}
        isLoading
        loadingLabel={STRINGS.states.loading}
      />
      <DataTable
        scrollEnabled={false}
        label={STRINGS.states.errorLabel}
        items={[]}
        columns={PLAIN_COLUMNS}
        query={NO_QUERY}
        onQueryChange={ignore}
        error={STRINGS.states.failure}
        isMessageShown
        onRetry={() => setRetries((count) => count + 1)}
        headingLevel={4}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {STRINGS.states.retries(retries)}
      </Text>
    </>
  );
}

/** A table over the pretend server: it searches, sorts, pages, selects and acts. */
function LiveSample() {
  const [query, setQuery] = useState<ResourceQuery>(NO_QUERY);
  const [cursor, setCursor] = useState(0);
  const [history, setHistory] = useState<readonly number[]>([]);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [isAll, setIsAll] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const matches = ordersFor(query);
  const next = cursor + PAGE_SIZE;

  /** Any change of the query goes back to the first page and clears the selection. */
  const change = (nextQuery: ResourceQuery) => {
    setQuery(nextQuery);
    setCursor(0);
    setHistory([]);
    setSelected([]);
    setIsAll(false);
  };

  return (
    <>
      <DataTable
        scrollEnabled={false}
        label={STRINGS.live.label}
        items={matches.slice(cursor, next)}
        columns={SORTABLE_COLUMNS}
        renderCell={renderOrderCell}
        query={query}
        onQueryChange={change}
        headingLevel={4}
        filterBar={
          <SearchField
            accessibilityLabel={STRINGS.live.search}
            placeholder={STRINGS.live.search}
            value={query.search}
            onChange={(search) => change({ ...query, search })}
          />
        }
        rowActions={rowActionsOf(setLast)}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        bulkActions={bulkActionsOf(setLast, () => {
          setSelected([]);
          setIsAll(false);
        })}
        totalCount={matches.length}
        isAllMatchingSelected={isAll}
        onAllMatchingSelectedChange={setIsAll}
        hasMore={next < matches.length}
        hasPrevious={history.length > 0}
        onNext={() => {
          setHistory((past) => [...past, cursor]);
          setCursor(next);
          setSelected([]);
        }}
        onPrevious={() => {
          setCursor(history.at(-1) ?? 0);
          setHistory((past) => past.slice(0, -1));
          setSelected([]);
        }}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {STRINGS.live.matching(matches.length)}
      </Text>
      <Text tone="muted">{STRINGS.rowActions.last(last)}</Text>
      <Button size="sm" variant="tertiary" onPress={() => change(NO_QUERY)}>
        {STRINGS.live.reset}
      </Button>
    </>
  );
}

/** The DataTable page: one section per option, in a scrollable screen. */
export function DataTableScreen() {
  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <DataTable
          scrollEnabled={false}
          label={STRINGS.basics.label}
          items={ORDERS.slice(0, 3)}
          columns={PLAIN_COLUMNS}
          renderCell={renderOrderCell}
          query={NO_QUERY}
          onQueryChange={ignore}
          headingLevel={4}
        />
      </Section>

      <Section title={STRINGS.rowActions.title} description={STRINGS.rowActions.description}>
        <RowActionsSample />
      </Section>

      <Section title={STRINGS.selection.title} description={STRINGS.selection.description}>
        <SelectionSample />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <StatesSample />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <LiveSample />
      </Section>
    </Screen>
  );
}
