/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Table: each row is a card; a column's label sits over its value.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Table, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TABLE_DEMO_KEYS } from "#src/demos/free/table/table-demo-keys.constant";

import { TABLE_ORDERS } from "#src/demos/free/table/table-orders.constant";
import { useTableColumns } from "#src/demos/free/table/use-table-columns";

/** The demo's keys. */
const K = TABLE_DEMO_KEYS.demo_free.table.basics;

/** The row-header column names the row; statuses here are the raw values. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const { columns } = useTableColumns();
  return (
    <Table
      label={t(K.label)}
      items={TABLE_ORDERS.slice(0, 3)}
      columns={columns}
      scrollEnabled={false}
    />
  );
}
