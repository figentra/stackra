/**
 * Stackra file contract:
 * Purpose: the "filter-slot" demo of the web Data table: The table draws any node above its rows. Here it is a search
 *          field that writes to the same engine; the FilterBar component goes in the same place.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0505 (one engine); ADR 0060 (light, dark, RTL).
 */
import type { Tone } from "@stackra/contracts";
import type { TableColumn } from "@stackra/ui/contracts";
import {
  Chip,
  DataTable as UiDataTable,
  SearchField,
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

/** A table with a search field in the filter bar slot, writing to the same engine. */
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
  // The engine searches the rows itself; the slot's field writes its search.
  const collection = useCollection({
    columns: PLAIN_COLUMNS,
    items: ORDERS,
    paging: "page",
    initialState: { pageSize: 5 },
  });
  const { search } = collection.state;
  return (
    <>
      <UiDataTable
        label={t(K.filter_slot_label)}
        collection={collection}
        renderCell={renderOrderCell}
        headingLevel={3}
        filterBar={
          <SearchField
            aria-label={t(K.search_label)}
            value={search}
            onChange={collection.setSearch}
          />
        }
      />
      <Text role="status" data-testid="data-table-slot-query" tone="muted">
        {t(K.query, { search: search || "none" })}
      </Text>
    </>
  );
}

/** Data table: Filter bar slot. */
export default function FilterSlot() {
  return <FilterSlotExample />;
}
