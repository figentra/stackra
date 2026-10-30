/**
 * Stackra file contract:
 * Purpose: the "pinned" demo of the web DataTable: the order pinned to the start and the total to the end, both staying put with an edge shadow while the other columns scroll sideways.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import { DataTable, Text, useCollection } from "@stackra/ui/react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** Data table: Pinned columns. */
export default function Pinned() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(12);
  const collection = useCollection({ columns, items: orders, initialState: { columns: columns.map((column) => ({ id: column.id, ...(column.id === "order" ? { pin: "start" as const } : column.id === "total" ? { pin: "end" as const } : {}) })) } });
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.pinned_hint)}</Text>
      <DataTable
        label={t(K.pinned_label)}
        items={collection.rows}
        columns={collection.columns}
        collection={collection}
        renderCell={renderCell}
        hasColumnTools
        isStickyHeader
        maxHeight="22rem"
        query={{ search: "", filterValues: {}, sort: collection.state.sort[0] ?? null }}
        onQueryChange={() => {}}
      />
    </div>
  );
}
