/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Table` (@stackra/ui): rows as cards with a column's label
 *          over each value, cells the page draws itself, a sort chooser whose sort the page applies, one and several
 *          rows selected, and the empty and the loading table.
 * Boundary: presentation and local demo state only; the table is @stackra/ui's, nothing here is styled by hand. The
 *          table never sorts: the page sorts its rows and hands them back in order, as a server would. The table
 *          draws its rows in a `FlatList`, so the samples keep their rows few.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import type { Tone } from "@stackra/contracts";
import type { SortDescriptor, TableColumn } from "@stackra/ui/contracts";
import { Chip, EmptyState, Table, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description:
      "Each row is a card; a column's label sits over its value, and the row-header column names the row.",
    label: "Orders",
  },
  cells: {
    title: "Cells",
    description:
      "`renderCell` draws a cell as the page likes: a chip for the status, money for the total.",
    label: "Orders with drawn cells",
  },
  sorting: {
    title: "Sorting",
    description:
      "Sortable columns become buttons in the header. A press asks for a sort through `onSortChange`; the page sorts and hands the rows back.",
    label: "Orders, sorted by the page",
    sorted: (sort: SortDescriptor | undefined) =>
      sort ? `Sorted by: ${sort.column}, ${sort.direction}` : "Sorted by: none",
  },
  selection: {
    title: "Selection",
    description:
      "`selectionMode`: pressing a row selects it, one at a time or several; a selected row is tinted.",
    single: "Orders, one selected",
    multiple: "Orders, several selected",
    chosen: (keys: readonly string[]) =>
      `Selected: ${keys.length === 0 ? "none" : keys.join(", ")}`,
  },
  states: {
    title: "Empty and loading",
    description:
      "No rows shows `emptyState`; while `isLoading` the table is busy and says what loads.",
    emptyLabel: "Orders, empty",
    emptyTitle: "No orders yet",
    emptyBody: "Orders appear here once a customer pays.",
    loadingLabel: "Orders, first load",
    reloadLabel: "Orders, reloading",
    loading: "Loading orders",
  },
  columns: {
    order: "Order",
    customer: "Customer",
    status: "Status",
    total: "Total",
  },
} as const;

/** One order of the samples. */
interface Order {
  readonly id: string;
  readonly order: string;
  readonly customer: string;
  readonly status: "Paid" | "Pending" | "Refunded";
  readonly total: number;
}

/** The rows of every sample. */
const ORDERS: readonly Order[] = [
  { id: "ord-1001", order: "#1001", customer: "Ada Lovelace", status: "Paid", total: 124.5 },
  { id: "ord-1002", order: "#1002", customer: "Grace Hopper", status: "Pending", total: 38 },
  { id: "ord-1003", order: "#1003", customer: "Linus Torvalds", status: "Refunded", total: 76.25 },
  { id: "ord-1004", order: "#1004", customer: "Margaret Hamilton", status: "Paid", total: 210 },
];

/** The columns of the plain samples. */
const COLUMNS: readonly TableColumn[] = [
  { id: "order", label: STRINGS.columns.order },
  { id: "customer", label: STRINGS.columns.customer },
  { id: "status", label: STRINGS.columns.status },
  { id: "total", label: STRINGS.columns.total },
];

/** The columns of the sorting sample: every one but the status can be sorted. */
const SORTABLE_COLUMNS: readonly TableColumn[] = COLUMNS.map((column) => ({
  ...column,
  isSortable: column.id !== "status",
}));

/** The tone of each status chip. */
const STATUS_TONE: Readonly<Record<Order["status"], Tone>> = Object.freeze({
  Paid: "success",
  Pending: "warning",
  Refunded: "default",
});

/** Fixed to US dollars in English, so a total reads the same in both reading directions. */
const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** The cell of the drawn samples: the status as a chip, the total as money, the rest as the table's own text. */
function renderOrderCell(order: Order, column: TableColumn) {
  if (column.id === "status") {
    return (
      <Chip size="sm" tone={STATUS_TONE[order.status]}>
        {order.status}
      </Chip>
    );
  }
  if (column.id === "total") return MONEY.format(order.total);
  return order[column.id as "order" | "customer"];
}

/** The orders sorted as asked; ties keep the list's own order, which is stable. */
function sortedOrders(
  orders: readonly Order[],
  sort: SortDescriptor | undefined,
): readonly Order[] {
  if (!sort) return orders;
  const key = sort.column as "order" | "customer" | "total";
  const factor = sort.direction === "ascending" ? 1 : -1;
  return [...orders].sort((first, second) => {
    const a = first[key];
    const b = second[key];
    return (
      (typeof a === "number" && typeof b === "number"
        ? a - b
        : String(a).localeCompare(String(b))) * factor
    );
  });
}

/** The Table page: one section per option, in a scrollable screen. */
export function TableScreen() {
  const [sort, setSort] = useState<SortDescriptor | undefined>({
    column: "total",
    direction: "descending",
  });
  const [one, setOne] = useState<readonly string[]>(["ord-1002"]);
  const [several, setSeveral] = useState<readonly string[]>(["ord-1001", "ord-1004"]);

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <Table
          label={STRINGS.basics.label}
          items={ORDERS.slice(0, 3)}
          columns={COLUMNS}
          scrollEnabled={false}
        />
      </Section>

      <Section title={STRINGS.cells.title} description={STRINGS.cells.description}>
        <Table
          label={STRINGS.cells.label}
          items={ORDERS.slice(0, 3)}
          columns={COLUMNS}
          renderCell={renderOrderCell}
          scrollEnabled={false}
        />
      </Section>

      <Section title={STRINGS.sorting.title} description={STRINGS.sorting.description}>
        <Table
          label={STRINGS.sorting.label}
          items={sortedOrders(ORDERS, sort)}
          columns={SORTABLE_COLUMNS}
          renderCell={renderOrderCell}
          sortDescriptor={sort}
          onSortChange={setSort}
          scrollEnabled={false}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.sorting.sorted(sort)}
        </Text>
      </Section>

      <Section title={STRINGS.selection.title} description={STRINGS.selection.description}>
        <Table
          label={STRINGS.selection.single}
          items={ORDERS.slice(0, 3)}
          columns={COLUMNS}
          renderCell={renderOrderCell}
          selectionMode="single"
          selectedKeys={one}
          onSelectionChange={setOne}
          scrollEnabled={false}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.selection.chosen(one)}
        </Text>
        <Table
          label={STRINGS.selection.multiple}
          items={ORDERS.slice(0, 3)}
          columns={COLUMNS}
          renderCell={renderOrderCell}
          selectionMode="multiple"
          selectedKeys={several}
          onSelectionChange={setSeveral}
          scrollEnabled={false}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.selection.chosen(several)}
        </Text>
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <Table
          label={STRINGS.states.emptyLabel}
          items={[]}
          columns={COLUMNS}
          scrollEnabled={false}
          emptyState={
            <EmptyState
              headingLevel={3}
              title={STRINGS.states.emptyTitle}
              description={STRINGS.states.emptyBody}
            />
          }
        />
        <Table
          label={STRINGS.states.loadingLabel}
          items={[]}
          columns={COLUMNS}
          isLoading
          loadingLabel={STRINGS.states.loading}
          scrollEnabled={false}
        />
        <Table
          label={STRINGS.states.reloadLabel}
          items={ORDERS.slice(0, 2)}
          columns={COLUMNS}
          renderCell={renderOrderCell}
          isLoading
          loadingLabel={STRINGS.states.loading}
          scrollEnabled={false}
        />
      </Section>
    </Screen>
  );
}
