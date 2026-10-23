/**
 * Stackra file contract:
 * Purpose: the page of the DataGrid route: `@stackra/ui-pro`'s DataGrid with invoices, sortable columns (the
 *          amount sorts as a number), row selection with checkboxes, and a live count of the selected rows.
 * Boundary: presentation only; the data is local. Amounts and dates are isolated left to right (`<bdi>`) so a
 *          right-to-left page keeps them readable.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304 (decision 6); ADR 0060 (light, dark, RTL); STA-403 FR-013.
 */
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { ProDataGridRoute } from "#src/routes/pro-data-grid/pro-data-grid.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-data-grid.*` keys.
const STRINGS = {
  documentTitle: `${ProDataGridRoute.title} · Stackra Playground`,
  intro:
    "A grid with sortable columns and row selection. Press a column header to sort by it, and press again to reverse; select rows with their checkboxes.",
  grid: "Invoices",
  columns: { customer: "Customer", status: "Status", amount: "Amount", due: "Due" },
  status: { paid: "Paid", pending: "Pending", overdue: "Overdue" },
  empty: "No invoices.",
  selected: (count: number, total: number) => `${count} of ${total} selected`,
} as const;

/** One invoice row. */
interface Invoice {
  readonly id: string;
  readonly customer: string;
  readonly status: keyof typeof STRINGS.status;
  readonly amount: number;
  readonly due: string;
}

const INVOICES: Invoice[] = [
  { id: "inv_1", customer: "Ada Lovelace", status: "paid", amount: 1250, due: "2026-09-12" },
  { id: "inv_2", customer: "Grace Hopper", status: "pending", amount: 480.5, due: "2026-11-02" },
  { id: "inv_3", customer: "Alan Turing", status: "overdue", amount: 3200, due: "2026-08-30" },
  { id: "inv_4", customer: "Margaret Hamilton", status: "paid", amount: 90, due: "2026-10-01" },
  {
    id: "inv_5",
    customer: "Edsger Dijkstra",
    status: "pending",
    amount: 760.25,
    due: "2026-11-20",
  },
  { id: "inv_6", customer: "Barbara Liskov", status: "overdue", amount: 15, due: "2026-07-15" },
];

const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

const COLUMNS: UiPro.DataGridColumn<Invoice>[] = [
  {
    id: "customer",
    header: STRINGS.columns.customer,
    accessorKey: "customer",
    isRowHeader: true,
    allowsSorting: true,
  },
  {
    id: "status",
    header: STRINGS.columns.status,
    accessorKey: "status",
    allowsSorting: true,
    cell: (invoice) => STRINGS.status[invoice.status],
  },
  {
    id: "amount",
    header: STRINGS.columns.amount,
    accessorKey: "amount",
    align: "end",
    allowsSorting: true,
    sortFn: (a, b) => a.amount - b.amount,
    cell: (invoice) => (
      <bdi className="tabular-nums" dir="ltr">
        {MONEY.format(invoice.amount)}
      </bdi>
    ),
  },
  {
    id: "due",
    header: STRINGS.columns.due,
    accessorKey: "due",
    allowsSorting: true,
    cell: (invoice) => <bdi dir="ltr">{DATE.format(new Date(invoice.due))}</bdi>,
  },
];

/** The DataGrid page. */
export function ProDataGrid() {
  const [selected, setSelected] = useState<UiPro.DataGridSelection>(new Set());
  const count = selected === "all" ? INVOICES.length : selected.size;

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProDataGridRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <UiPro.DataGrid
        label={STRINGS.grid}
        data={INVOICES}
        columns={COLUMNS}
        getRowId={(invoice) => invoice.id}
        defaultSortDescriptor={{ column: "customer", direction: "ascending" }}
        selectionMode="multiple"
        showSelectionCheckboxes
        selectedKeys={selected}
        onSelectionChange={setSelected}
        renderEmptyState={() => STRINGS.empty}
      />
      <p role="status" className="text-muted">
        {STRINGS.selected(count, INVOICES.length)}
      </p>
    </article>
  );
}
