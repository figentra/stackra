/**
 * Stackra file contract:
 * Purpose: the "grouped" demo of the web DataTable: orders grouped by status, each heading row with its count and the
 *          sum of the totals, and a grand total at the end.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); product audit 2026-10-28
 *          (group-by and aggregates); ADR 0060 (light, dark, RTL).
 */
import type { TableColumn } from "@stackra/ui/contracts";
import { DataTable, useCatalogueText, useCollection } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_KEYS } from "#src/demos/free/data-table/data-table-keys.constant";

/** The demo's keys. */
const K = DATA_TABLE_KEYS.data_table;

/** Eight orders in three statuses. */
const ORDERS = Array.from({ length: 8 }, (_, index) => ({
  id: `ord-${1001 + index}`,
  order: `#${1001 + index}`,
  status: (["Paid", "Pending", "Refunded"] as const)[index % 3] ?? "Paid",
  total: ((index * 37) % 90) + 10,
}));

/** Data table: Grouped with totals. */
export default function Grouped() {
  const t = useCatalogueText(MESSAGES.en);
  const columns: readonly TableColumn[] = [
    { id: "order", label: t(K.column_order) },
    { id: "status", label: t(K.column_status) },
    { id: "total", label: t(K.column_total), align: "end" },
  ];
  const collection = useCollection({
    columns,
    items: ORDERS,
    initialState: { groupBy: "status", aggregates: { total: "sum" } },
  });
  return <DataTable label={t(K.grouped_label)} collection={collection} headingLevel={4} />;
}
