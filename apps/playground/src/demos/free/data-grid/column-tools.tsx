/**
 * Stackra file contract:
 * Purpose: the "column-tools" demo of the web DataGrid: stock and prices by branch with the column tools on: the item pinned to the start, header menus, a resize strip on each header (drag, or focus and use the arrows), drag to reorder.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import type { DataGridColumn } from "@stackra/ui/contracts";
import { DataGrid } from "@stackra/ui/react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** Data grid: Column tools. */
export default function ColumnTools() {
  const { t, K } = useGulfOrders(0);
  const columns: readonly DataGridColumn[] = [
    { id: "product", label: t(K.column_product), isReadOnly: true, width: 180 },
    { id: "price", label: t(K.price), type: "number", min: 0 },
    { id: "riyadh", label: t(K.branch_riyadh), type: "number", min: 0, width: 140 },
    { id: "jeddah", label: t(K.branch_jeddah), type: "number", min: 0, width: 140 },
    { id: "dammam", label: t(K.branch_dammam), type: "number", min: 0, width: 140 },
  ];
  const rows = Array.from({ length: 8 }, (_, index) => ({
    id: `p${index}`,
    product: t(K[`product_${index}` as "product_0"]),
    price: [85, 140, 320, 95, 260, 180, 450, 120][index] ?? 100,
    riyadh: (index * 13) % 40,
    jeddah: (index * 7) % 30,
    dammam: (index * 5) % 20,
  }));
  return (
    <DataGrid label={t(K.grid_label)} columns={columns} rows={rows} hasColumnTools height="20rem" />
  );
}
