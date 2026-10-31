/**
 * Stackra file contract:
 * Purpose: the "sorting" demo of the web Data table: the sort is part of the engine's query. A press on a sortable
 *          header changes the server-mode engine's sort, and this page plays the server (`fetch`) and hands back the
 *          rows in that order.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0505 (one engine); ADR 0060 (light, dark, RTL).
 */
import type { Tone } from "@stackra/contracts";
import type { CollectionQuery, TableColumn } from "@stackra/ui/contracts";
import {
  Chip,
  DataTable as UiDataTable,
  Text,
  useCatalogueText,
  useCollection,
} from "@stackra/ui/react";
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
function ordersFor(query: CollectionQuery): readonly Order[] {
  const needle = query.search.trim().toLowerCase();
  const found = ORDERS.filter(
    (order) =>
      needle === "" ||
      order.order.toLowerCase().includes(needle) ||
      order.customer.toLowerCase().includes(needle),
  );
  const [sort] = query.sort;
  if (!sort) return found;
  const key = sort.column as keyof Order;
  const factor = sort.direction === "ascending" ? 1 : -1;
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

/** The server's answer to a query: the first six orders in its order. */
const fetchOrders = async (query: CollectionQuery) => {
  const found = ordersFor(query);
  return { items: found.slice(0, 6), totalCount: found.length };
};

/** A table whose sort lives in the engine's query, the page playing the server. */
function SortingExample() {
  const t = useCatalogueText(MESSAGES.en);
  /** The columns: every one sortable but the status. */
  const COLUMNS: readonly TableColumn[] = [
    { id: "order", label: t(K.column_order), isSortable: true },
    { id: "customer", label: t(K.column_customer), isSortable: true },
    { id: "status", label: t(K.column_status) },
    { id: "total", label: t(K.column_total), isSortable: true, align: "end" },
  ];
  const collection = useCollection({
    columns: COLUMNS,
    mode: "server",
    fetch: fetchOrders,
    initialState: { sort: [{ column: "total", direction: "descending" }] },
  });
  const [sort] = collection.state.sort;
  return (
    <>
      <UiDataTable label={t(K.sorted_label)} collection={collection} renderCell={renderOrderCell} />
      <Text role="status" data-testid="data-table-sort" tone="muted">
        {t(K.sorted, {
          column: sort?.column ?? "none",
          direction: sort?.direction ?? "",
        })}
      </Text>
    </>
  );
}

/** Data table: Sorting. */
export default function Sorting() {
  return <SortingExample />;
}
