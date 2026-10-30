/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Data table: A fake server with 24 orders in pages of five. Search, sort, page,
 *          select rows and run an action; every change of the query returns to the first page and clears the
 *          selection.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0318 (decisions 2 and 4 to 6); ADR 0060 (light, dark, RTL).
 */
import type { Tone } from "@stackra/contracts";
import type { ResourceAction, ResourceQuery, TableColumn } from "@stackra/ui/contracts";
import {
  Button,
  Chip,
  DataTable as UiDataTable,
  SearchField,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_KEYS } from "#src/demos/free/data-table/data-table-keys.constant";

/** The demo's keys. */
const K = DATA_TABLE_KEYS.data_table;

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

/** The tone of each status chip. */
const STATUS_TONE: Readonly<Record<Order["status"], Tone>> = Object.freeze({
  Paid: "success",
  Pending: "warning",
  Refunded: "default",
});

/** Fixed to US dollars in English, so the total reads the same in both reading directions. */
const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** The query with nothing set. */
const NO_QUERY: ResourceQuery = Object.freeze({ search: "", filterValues: {}, sort: null });

/** How many rows a page of the live table holds. */
const PAGE_SIZE = 5;

/** How long a fake action or page takes, so a busy state can be seen and tested. */
const DELAY = 500;

/** How long the slow row action takes: long enough for a busy e2e runner to reopen the menu and see it working. */
const SLOW_ACTION = 2000;

/** Waits for `ms` milliseconds. */
const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** The cell of a sample: the status as a chip and the total as money, the rest as the table's own text. */
function renderOrderCell(order: Order, column: TableColumn) {
  if (column.id === "status") return <Chip tone={STATUS_TONE[order.status]}>{order.status}</Chip>;
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
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
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

/** The row actions of the samples: one that works, one that takes a moment, one that fails, one refused. */
function rowActionsOf(t: ReturnType<typeof useCatalogueText>, report: (text: string) => void) {
  return (order: Order): readonly ResourceAction[] => [
    { id: "open", label: t(K.open), onPress: () => report(`${t(K.open)} ${order.order}`) },
    {
      id: "archive",
      label: t(K.archive),
      onPress: async () => {
        await delay(SLOW_ACTION);
        report(t(K.done, { name: `${t(K.archive)} ${order.order}` }));
      },
    },
    {
      id: "refund",
      label: t(K.refund),
      isDisabled: order.status !== "Paid",
      disabledReason: t(K.refund_reason),
      onPress: () => report(`${t(K.refund)} ${order.order}`),
    },
    {
      id: "delete",
      label: t(K.delete),
      tone: "danger",
      onPress: async () => {
        await delay(DELAY);
        report(t(K.failed, { name: `${t(K.delete)} ${order.order}` }));
        throw new Error(t(K.failure));
      },
    },
  ];
}

/** The bulk actions of the samples: one that succeeds and clears, and one that fails and leaves the selection. */
function bulkActionsOf(
  t: ReturnType<typeof useCatalogueText>,
  report: (text: string) => void,
  clear: () => void,
): readonly ResourceAction[] {
  return [
    {
      id: "archive",
      label: t(K.archive),
      onPress: async () => {
        await delay(DELAY);
        report(t(K.done, { name: t(K.archive) }));
        clear();
      },
    },
    {
      id: "delete",
      label: t(K.delete),
      tone: "danger",
      onPress: async () => {
        await delay(DELAY);
        report(t(K.failed, { name: t(K.delete) }));
        throw new Error(t(K.failure));
      },
    },
  ];
}

/** The live table: a fake server that searches, sorts and pages, with selection and actions on top. */
function LiveExample() {
  const t = useCatalogueText(MESSAGES.en);

  /** The columns: every one sortable but the status. */
  const COLUMNS: readonly TableColumn[] = [
    { id: "order", label: t(K.column_order), isSortable: true },
    { id: "customer", label: t(K.column_customer), isSortable: true },
    { id: "status", label: t(K.column_status) },
    { id: "total", label: t(K.column_total), isSortable: true, align: "end" },
  ];
  const [query, setQuery] = useState<ResourceQuery>(NO_QUERY);
  const [cursor, setCursor] = useState(0);
  const [history, setHistory] = useState<readonly number[]>([]);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [isAll, setIsAll] = useState(false);
  const [isFailing, setIsFailing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [last, setLast] = useState<string>(t(K.none));

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
      <UiDataTable
        label={t(K.live_label)}
        items={rows}
        columns={COLUMNS}
        renderCell={renderOrderCell}
        query={query}
        onQueryChange={change}
        headingLevel={3}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        rowActions={rowActionsOf(t, setLast)}
        bulkActions={bulkActionsOf(t, setLast, () => {
          setSelected([]);
          setIsAll(false);
        })}
        totalCount={found.length}
        isAllMatchingSelected={isAll}
        onAllMatchingSelectedChange={setIsAll}
        isLoading={isLoading}
        loadingLabel={t(K.loading_text)}
        hasMore={next < found.length}
        hasPrevious={history.length > 0}
        onNext={() => void go(next, [...history, cursor])}
        onPrevious={() => void go(history.at(-1) ?? 0, history.slice(0, -1))}
        error={isFailing ? new Error(t(K.failure)) : undefined}
        isMessageShown
        onRetry={() => setIsFailing(false)}
        filterBar={
          <SearchField
            aria-label={t(K.live_search)}
            value={query.search}
            onChange={(search) => change({ ...query, search })}
          />
        }
      />
      <Text role="status" data-testid="data-table-live-query" tone="muted">
        {t(K.query, { search: query.search || "none" })} ·{" "}
        {t(K.sorted, {
          column: query.sort?.column ?? "none",
          direction: query.sort?.direction ?? "",
        })}
      </Text>
      <Text role="status" data-testid="data-table-live-selected" tone="muted">
        {t(K.selected, { keys: selected.join(", ") || "none" })}
      </Text>
      <Text role="status" data-testid="data-table-live-last" tone="muted">
        {t(K.last_action, { text: last })}
      </Text>
      <Text data-testid="data-table-live-matching" tone="muted">
        {t(K.matching, { count: found.length })}
      </Text>
      <div>
        <Button variant="secondary" onPress={() => setIsFailing((current) => !current)}>
          {isFailing ? t(K.recover) : t(K.simulate_error)}
        </Button>
      </div>
    </>
  );
}

/** Data table: Try it. */
export default function Live() {
  return <LiveExample />;
}
