/**
 * Stackra file contract:
 * Purpose: the "grouped" demo of the native DataTable: orders grouped by status with a count and sum per group and a
 *          grand total at the end.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); product audit 2026-10-28.
 */
import { DataTable, useCatalogueText, useCollection } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_DEMO_KEYS } from "#src/demos/free/data-table/data-table-demo-keys.constant";
import { ORDERS } from "#src/demos/free/data-table/orders.constant";
import { useOrderTable } from "#src/demos/free/data-table/use-order-table";

/** The demo's keys. */
const K = DATA_TABLE_DEMO_KEYS.demo_free.data_table.grouped;

/** The statuses' keys. */
const STATUS = DATA_TABLE_DEMO_KEYS.demo_free.data_table.status;

/** Orders grouped by status, with totals. */
export default function Grouped() {
  const t = useCatalogueText(MESSAGES.en);
  const { columns, renderCell } = useOrderTable();
  const collection = useCollection({
    columns,
    // Grouped by the status's words, so a heading reads in the active language.
    items: ORDERS.slice(0, 6).map((order) => ({ ...order, statusLabel: t(STATUS[order.status]) })),
    initialState: { groupBy: "statusLabel", aggregates: { total: "sum" } },
  });
  return (
    <DataTable
      scrollEnabled={false}
      label={t(K.label)}
      collection={collection}
      renderCell={renderCell}
      headingLevel={4}
    />
  );
}
