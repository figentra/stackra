/**
 * Stackra file contract:
 * Purpose: the "paging" demo of the web Data table: Previous and next ask a server-mode engine for a cursor page;
 *          there is no page number. The engine keeps the cursors it showed, so Previous goes back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0505 (one engine, one pager); ADR 0060 (light, dark, RTL).
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

/** How many rows a page of the live table holds. */
const PAGE_SIZE = 5;

/** The cell of a sample: the status as a chip and the total as money, the rest as the table's own text. */
function renderOrderCell(order: Order, column: TableColumn) {
  if (column.id === "status") return <Chip tone={STATUS_TONE[order.status]}>{order.status}</Chip>;
  if (column.id === "total") return <bdi>{MONEY.format(order.total)}</bdi>;
  return <bdi>{String(order[column.id as keyof Order])}</bdi>;
}

/** The server: a page of five orders from a cursor (the index of its first row), and the cursor after it. */
const fetchPage = async (query: CollectionQuery) => {
  const start = Number(query.cursor ?? 0);
  const next = start + PAGE_SIZE;
  return {
    items: ORDERS.slice(start, next),
    totalCount: ORDERS.length,
    nextCursor: next < ORDERS.length ? String(next) : null,
  };
};

/** A table that pages by cursor over the fake server: the engine keeps the cursors, so Previous goes back. */
function PagingExample() {
  const t = useCatalogueText(MESSAGES.en);
  const columns: readonly TableColumn[] = [
    { id: "order", label: t(K.column_order) },
    { id: "customer", label: t(K.column_customer) },
    { id: "status", label: t(K.column_status) },
    { id: "total", label: t(K.column_total), align: "end" },
  ];
  const collection = useCollection({
    columns,
    mode: "server",
    paging: "cursor",
    fetch: fetchPage,
    initialState: { pageSize: PAGE_SIZE },
  });
  return (
    <>
      <UiDataTable
        label={t(K.paging_label)}
        collection={collection}
        renderCell={renderOrderCell}
        headingLevel={3}
      />
      <Text data-testid="data-table-cursor" tone="muted">
        <bdi>{t(K.cursor, { cursor: Number(collection.state.cursor ?? 0) })}</bdi>
      </Text>
    </>
  );
}

/** Data table: Cursor paging. */
export default function Paging() {
  return <PagingExample />;
}
