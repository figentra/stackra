/**
 * Stackra file contract:
 * Purpose: the "filter-slot" demo of the web Data table: The table draws any node above its rows. Here it is a search
 *          field that writes to the same query; the FilterBar component goes in the same place.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0318 (decisions 2 and 4 to 6); ADR 0060 (light, dark, RTL).
 */
import type { Tone } from "@stackra/contracts";
import type { ResourceQuery, TableColumn } from "@stackra/ui/contracts";
import {
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

/** A table with a search field in the filter bar slot, writing to the same query. */
function FilterSlotExample() {
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
  const [query, setQuery] = useState<ResourceQuery>(NO_QUERY);
  return (
    <>
      <UiDataTable
        label={t(K.filter_slot_label)}
        items={ordersFor(query).slice(0, 5)}
        columns={PLAIN_COLUMNS}
        renderCell={renderOrderCell}
        query={query}
        onQueryChange={setQuery}
        headingLevel={3}
        filterBar={
          <SearchField
            aria-label={t(K.search_label)}
            value={query.search}
            onChange={(search) => setQuery({ ...query, search })}
          />
        }
      />
      <Text role="status" data-testid="data-table-slot-query" tone="muted">
        {t(K.query, { search: query.search || "none" })}
      </Text>
    </>
  );
}

/** Data table: Filter bar slot. */
export default function FilterSlot() {
  return <FilterSlotExample />;
}
