/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native DataTable: each row is a card; the page owns the query that fetched the rows.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { DataTable, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_DEMO_KEYS } from "#src/demos/free/data-table/data-table-demo-keys.constant";
import { ORDERS } from "#src/demos/free/data-table/orders.constant";
import { useOrderTable } from "#src/demos/free/data-table/use-order-table";

/** The demo's keys. */
const K = DATA_TABLE_DEMO_KEYS.demo_free.data_table.basics;

/** Three orders; the query never changes. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const { columns, renderCell } = useOrderTable();
  return (
    <DataTable
      scrollEnabled={false}
      label={t(K.label)}
      items={ORDERS.slice(0, 3)}
      columns={columns}
      renderCell={renderCell}
      headingLevel={4}
    />
  );
}
