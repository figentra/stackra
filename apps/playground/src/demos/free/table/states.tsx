/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Table: An empty table says why, a first load shows a spinner row in the rows’
 *          place, and a reload keeps the rows and adds a loading row after them. Loading is announced once.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0060 (light, dark, RTL).
 */
import type { Tone } from "@stackra/contracts";
import type { TableColumn } from "@stackra/ui/contracts";
import { Chip, Table as UiTable, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TABLE_KEYS } from "#src/demos/free/table/table-keys.constant";

/** The demo's keys. */
const K = TABLE_KEYS.table;

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
  return String(order[column.id as keyof Order]);
}

/** The first rows of the sample lists. */
const FEW = ORDERS.slice(0, 5);

/** The grid that lays the samples out one under the other. */
const STACK = "grid gap-8";

/** The Table demo: states. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  /** The columns: every one sortable but the status. */
  const COLUMNS: readonly TableColumn[] = [
    { id: "order", label: t(K.column_order), isSortable: true },
    { id: "customer", label: t(K.column_customer), isSortable: true },
    { id: "status", label: t(K.column_status) },
    { id: "total", label: t(K.column_total), isSortable: true, align: "end" },
    { id: "placed", label: t(K.column_placed), isSortable: true },
  ];
  /** The same columns without sorting, for the samples that do not sort. */
  const PLAIN_COLUMNS: readonly TableColumn[] = COLUMNS.map((column) => ({
    id: column.id,
    label: column.label,
    ...(column.align ? { align: column.align } : {}),
  }));
  return (
    <div className={STACK}>
      <UiTable
        label={t(K.empty_label)}
        items={[]}
        columns={PLAIN_COLUMNS}
        emptyState={<Text tone="muted">{t(K.empty)}</Text>}
      />
      <UiTable
        label={t(K.loading_label)}
        items={[]}
        columns={PLAIN_COLUMNS}
        isLoading
        loadingLabel={t(K.loading_text)}
      />
      <UiTable
        label={t(K.reloading_label)}
        items={FEW}
        columns={PLAIN_COLUMNS}
        renderCell={renderOrderCell}
        isLoading
        loadingLabel={t(K.loading_text)}
      />
    </div>
  );
}
