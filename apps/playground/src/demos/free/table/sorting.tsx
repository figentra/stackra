/**
 * Stackra file contract:
 * Purpose: the "sorting" demo of the web Table: A press on a sortable header asks for a sort. This page plays the
 *          server: it sorts its list and hands the table the rows in that order.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0060 (light, dark, RTL).
 */
import type { Tone } from "@stackra/contracts";
import type { SortDescriptor, TableColumn } from "@stackra/ui/contracts";
import { Chip, Table as UiTable, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
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

/**
 * The server: the orders sorted as asked. A table is handed the result and never sorts, so this is the page's job.
 * Ties keep the list's own order, which is stable.
 */
function sortedOrders(sort: SortDescriptor | undefined): readonly Order[] {
  if (!sort) return ORDERS;
  const key = sort.column as keyof Order;
  const factor = sort.direction === "ascending" ? 1 : -1;
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
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

/** The Table demo: sorting. */
export default function Sorting() {
  const t = useCatalogueText(MESSAGES.en);
  /** The columns: every one sortable but the status. */
  const COLUMNS: readonly TableColumn[] = [
    { id: "order", label: t(K.column_order), isSortable: true },
    { id: "customer", label: t(K.column_customer), isSortable: true },
    { id: "status", label: t(K.column_status) },
    { id: "total", label: t(K.column_total), isSortable: true, align: "end" },
    { id: "placed", label: t(K.column_placed), isSortable: true },
  ];
  const [sort, setSort] = useState<SortDescriptor>({ column: "total", direction: "descending" });

  return (
    <div className="grid gap-6">
      <UiTable
        label={t(K.sorted_label)}
        items={sortedOrders(sort).slice(0, 6)}
        columns={COLUMNS}
        renderCell={renderOrderCell}
        sortDescriptor={sort}
        onSortChange={setSort}
      />
      <Text role="status" data-testid="table-sort" tone="muted">
        {t(K.sorted, { column: sort.column, direction: sort.direction })}
      </Text>
    </div>
  );
}
