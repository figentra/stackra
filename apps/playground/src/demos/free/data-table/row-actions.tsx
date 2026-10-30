/**
 * Stackra file contract:
 * Purpose: the "row-actions" demo of the web Data table: Each row has a menu named for it. Archive takes a moment and
 *          shows itself working, Delete fails, and Refund is refused for an order that is not paid, with its reason.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0318 (decisions 2 and 4 to 6); ADR 0060 (light, dark, RTL).
 */
import type { Tone } from "@stackra/contracts";
import type { ResourceAction, ResourceQuery, TableColumn } from "@stackra/ui/contracts";
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

/** How long a fake action or page takes, so a busy state can be seen and tested. */
const DELAY = 500;

/** How long the slow row action takes: long enough for a busy e2e runner to reopen the menu and see it working. */
const SLOW_ACTION = 2000;

/** Does nothing: a sample whose query never changes. */
const ignore = () => undefined;

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

/** A table with a menu of actions on each row, and the last action named under it. */
function RowActionsExample() {
  const t = useCatalogueText(MESSAGES.en);

  const [last, setLast] = useState<string>(t(K.none));
  return (
    <>
      <Static
        label={t(K.row_actions_label)}
        rowActions={rowActionsOf(t, setLast)}
        headingLevel={3}
      />
      <Text role="status" data-testid="data-table-last-action" tone="muted">
        {t(K.last_action, { text: last })}
      </Text>
    </>
  );
}

/** Data table: Row actions. */
export default function RowActions() {
  return <RowActionsExample />;
}
