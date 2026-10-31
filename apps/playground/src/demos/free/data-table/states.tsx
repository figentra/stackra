/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Data table: Nothing here yet, no result for a search, a first load, a reload
 *          that keeps the rows, and a failed load with a retry.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0505 (one engine); ADR 0060 (light, dark, RTL).
 */
import type { Tone } from "@stackra/contracts";
import type { TableColumn } from "@stackra/ui/contracts";
import type { DataTableProps } from "@stackra/ui/react";
import {
  Chip,
  DataTable as UiDataTable,
  Heading,
  useCatalogueText,
  useCollection,
} from "@stackra/ui/react";
import type { ReactNode } from "react";
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

/** Does nothing: the retry of a sample that never recovers. */
const ignore = () => undefined;

/** The cell of a sample: the status as a chip and the total as money, the rest as the table's own text. */
function renderOrderCell(order: Order, column: TableColumn) {
  if (column.id === "status") return <Chip tone={STATUS_TONE[order.status]}>{order.status}</Chip>;
  if (column.id === "total") return <bdi>{MONEY.format(order.total)}</bdi>;
  return <bdi>{String(order[column.id as keyof Order])}</bdi>;
}

/** The first rows of the sample lists. */
const FEW = ORDERS.slice(0, 5);

/** The grid that lays the samples out one under the other. */
const STACK = "grid gap-8";

/** A captioned sample: a small heading over what it shows. */
function Sample({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Heading level={3}>{title}</Heading>
      {children}
    </div>
  );
}

/** A sample table with the common props of the page's static samples. */
function Static({
  items = FEW,
  search = "",
  ...props
}: Partial<DataTableProps<Order>> & { readonly label: string; readonly search?: string }) {
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
  // The engine searches the rows itself, so a search no row matches shows the "no results" state.
  const collection = useCollection({ columns: PLAIN_COLUMNS, items, initialState: { search } });
  return (
    <UiDataTable collection={collection} renderCell={renderOrderCell} headingLevel={4} {...props} />
  );
}

/** Data table: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={STACK}>
      <Sample title={t(K.empty_label)}>
        <Static label={t(K.empty_label)} items={[]} />
      </Sample>
      <Sample title={t(K.no_results_label)}>
        <Static label={t(K.no_results_label)} search="zzz" />
      </Sample>
      <Sample title={t(K.first_load_label)}>
        <Static
          label={t(K.first_load_label)}
          items={[]}
          isLoading
          loadingLabel={t(K.loading_text)}
        />
      </Sample>
      <Sample title={t(K.reload_label)}>
        <Static label={t(K.reload_label)} isLoading loadingLabel={t(K.loading_text)} />
      </Sample>
      <Sample title={t(K.error_label)}>
        <Static
          label={t(K.error_label)}
          error={new Error(t(K.failure))}
          isMessageShown
          onRetry={ignore}
        />
      </Sample>
    </div>
  );
}
