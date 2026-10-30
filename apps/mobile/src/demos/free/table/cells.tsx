/**
 * Stackra file contract:
 * Purpose: the "cells" demo of the native Table: `renderCell` draws a chip for the status and money for the total.
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
const K = TABLE_DEMO_KEYS.demo_free.table.cells;

/** The Table demo: cells drawn by a render function. */
export default function Cells() {
  const t = useCatalogueText(MESSAGES.en);
  const { columns, renderCell } = useTableColumns();
  return (
    <Table
      label={t(K.label)}
      items={TABLE_ORDERS.slice(0, 3)}
      columns={columns}
      renderCell={renderCell}
      scrollEnabled={false}
    />
  );
}
