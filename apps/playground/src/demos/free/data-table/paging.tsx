/**
 * Stackra file contract:
 * Purpose: the "paging" demo of the web Data table: Previous and next ask for a cursor page; there is no page number
 *          and no total. The pager appears only when the page gives a handler.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0318 (decisions 2 and 4 to 6); ADR 0060 (light, dark, RTL).
 */
import type { Tone } from "@stackra/contracts";
import type { ResourceQuery, TableColumn } from "@stackra/ui/contracts";
import type { DataTableProps } from "@stackra/ui/react";
import { Chip, DataTable as UiDataTable, Text, useCatalogueText } from "@stackra/ui/react";
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

/** Does nothing: a sample whose query never changes. */
const ignore = () => undefined;

/** The cell of a sample: the status as a chip and the total as money, the rest as the table's own text. */
function renderOrderCell(order: Order, column: TableColumn) {
  if (column.id === "status") return <Chip tone={STATUS_TONE[order.status]}>{order.status}</Chip>;
  if (column.id === "total") return <bdi>{MONEY.format(order.total)}</bdi>;
  return <bdi>{String(order[column.id as keyof Order])}</bdi>;
}

/** The first rows of the sample lists. */
const FEW = ORDERS.slice(0, 5);

/** A sample table with the common props of the page's static samples. */
function Static(props: Partial<DataTableProps<Order>> & { readonly label: string }) {
  const t = useCatalogueText(MESSAGES.en);
  /** The columns: every one sortable but the status. */
  const COLUMNS: readonly TableColumn[] = [
    { id: "order", label: t(K.column_order), isSortable: true },
    { id: "customer", label: t(K.column_customer), isSortable: true },
    { id: "status", label: t(K.column_status) },
    { id: "total", label: t(K.column_total), isSortable: true, align: "end" },
  ];
  /** The same columns without sorting, for the samples that do not sort. */
  const PLAIN_COLUMNS: readonly TableColumn[] = COLUMNS.map((column) => ({
    id: column.id,
    label: column.label,
    ...(column.align ? { align: column.align } : {}),
  }));
  return (
    <UiDataTable
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

/** A table that pages by cursor over the fake server. */
function PagingExample() {
  const t = useCatalogueText(MESSAGES.en);
  const [cursor, setCursor] = useState(0);
  const [history, setHistory] = useState<readonly number[]>([]);
  const rows = ORDERS.slice(cursor, cursor + PAGE_SIZE);
  const next = cursor + PAGE_SIZE;
  return (
    <>
      <Static
        label={t(K.paging_label)}
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
      <Text data-testid="data-table-cursor" tone="muted">
        <bdi>{t(K.cursor, { cursor })}</bdi>
      </Text>
    </>
  );
}

/** Data table: Cursor paging. */
export default function Paging() {
  return <PagingExample />;
}
