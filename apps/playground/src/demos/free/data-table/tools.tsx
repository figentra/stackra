/**
 * Stackra file contract:
 * Purpose: the "tools" demo of the web DataTable: one engine's saved views drawn three ways (tabs, chips and the menu
 *          that saves and manages them), and the column editor that hides, moves and renames columns.
 * Boundary: a demo with no props, @stackra/ui and local state only; the engine filters the rows in client mode.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0505 (one SavedViews, one
 *          column editor); ADR 0060 (light, dark, RTL).
 */
import type { CollectionColumn } from "@stackra/ui/contracts";
import {
  ColumnEditor,
  DataTable,
  SavedViews,
  useCatalogueText,
  useCollection,
} from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_KEYS } from "#src/demos/free/data-table/data-table-keys.constant";

/** The demo's keys. */
const K = DATA_TABLE_KEYS.data_table;

/** The statuses. */
const STATUSES = ["Paid", "Pending", "Refunded"] as const;

/** Twelve orders. */
const ORDERS = Array.from({ length: 12 }, (_, index) => ({
  id: `ord-${1001 + index}`,
  order: `#${1001 + index}`,
  customer: ["Ada Lovelace", "Grace Hopper", "Linus Torvalds"][index % 3] ?? "",
  status: STATUSES[index % 3] ?? "Paid",
  total: ((index * 37) % 90) + 10,
}));

/** Data table: Views and columns. */
export default function Tools() {
  const t = useCatalogueText(MESSAGES.en);
  const columns: readonly CollectionColumn[] = [
    { id: "order", label: t(K.column_order) },
    { id: "customer", label: t(K.column_customer) },
    {
      id: "status",
      label: t(K.column_status),
      type: "choice",
      options: STATUSES.map((status) => ({ id: status, label: status })),
    },
    { id: "total", label: t(K.column_total), type: "number", align: "end" },
  ];
  const collection = useCollection({
    columns,
    items: ORDERS,
    views: [
      { id: "all", label: t(K.view_all), state: { filter: { match: "all", conditions: [] } } },
      {
        id: "unpaid",
        label: t(K.view_unpaid),
        state: {
          filter: {
            match: "all",
            conditions: [{ id: "s", field: "status", operator: "in", value: ["Pending"] }],
          },
        },
      },
    ],
  });
  return (
    <div className="grid gap-3">
      <SavedViews collection={collection} variant="tabs" label={t(K.views_tabs_label)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SavedViews collection={collection} variant="chips" label={t(K.views_chips_label)} />
        <div className="flex items-center gap-2">
          <SavedViews collection={collection} label={t(K.views_label)} />
          <ColumnEditor collection={collection} />
        </div>
      </div>
      <DataTable label={t(K.tools_label)} collection={collection} headingLevel={4} />
    </div>
  );
}
