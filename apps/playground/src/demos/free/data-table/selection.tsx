/**
 * Stackra file contract:
 * Purpose: the "selection" demo of the web Data table: Several selected rows bring up the bar with their count. When
 *          every row on screen is selected, the bar offers all matching records, which the server counts. Archive
 *          succeeds and clears the selection; Delete fails and leaves it as it was.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0505 (one engine); ADR 0060 (light, dark, RTL).
 */
import type { Tone } from "@stackra/contracts";
import type { ResourceAction, TableColumn } from "@stackra/ui/contracts";
import {
  Chip,
  DataTable as UiDataTable,
  Text,
  useCatalogueText,
  useCollection,
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

/** How long a fake action or page takes, so a busy state can be seen and tested. */
const DELAY = 500;

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

/** The first rows of the sample lists. */
const FEW = ORDERS.slice(0, 5);

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

/** A table of several selectable rows with the bulk bar and select all matching. */
function SelectionExample() {
  const t = useCatalogueText(MESSAGES.en);
  const columns: readonly TableColumn[] = [
    { id: "order", label: t(K.column_order) },
    { id: "customer", label: t(K.column_customer) },
    { id: "status", label: t(K.column_status) },
    { id: "total", label: t(K.column_total), align: "end" },
  ];
  // Server mode: the page shows five rows of the 24 that match, so "select all 24" reaches past them.
  const collection = useCollection({
    columns,
    items: FEW,
    mode: "server",
    totalCount: ORDERS.length,
    initialState: { selection: ["ord-1001", "ord-1002"] },
  });
  const { selection: selected, isAllMatchingSelected: isAll } = collection.state;
  const [last, setLast] = useState<string>(t(K.none));
  return (
    <>
      <UiDataTable
        label={t(K.selection_label)}
        collection={collection}
        renderCell={renderOrderCell}
        headingLevel={4}
        selectionMode="multiple"
        bulkActions={bulkActionsOf(t, setLast, () => collection.setSelection([]))}
      />
      <Text role="status" data-testid="data-table-selected" tone="muted">
        {t(K.selected, { keys: selected.join(", ") || "none" })}
      </Text>
      <Text role="status" data-testid="data-table-all-matching" tone="muted">
        {t(K.all_matching, { is_all: isAll })}
      </Text>
      <Text role="status" data-testid="data-table-bulk-action" tone="muted">
        {t(K.last_action, { text: last })}
      </Text>
    </>
  );
}

/** Data table: Selection and the bulk bar. */
export default function Selection() {
  return <SelectionExample />;
}
