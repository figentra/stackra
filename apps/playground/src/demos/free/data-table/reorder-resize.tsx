/**
 * Stackra file contract:
 * Purpose: the "reorder-resize" demo of the web DataTable: drag a header to move the column, drag its edge to resize it, or use its menu's Resize column and Move towards start or end from the keyboard.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import { DataTable, Text, useCollection } from "@stackra/ui/react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** Data table: Reorder and resize headers. */
export default function ReorderResize() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(12);
  const collection = useCollection({ columns, items: orders });
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.reorder_hint)}</Text>
      <DataTable
        label={t(K.reorder_label)}
        collection={collection}
        renderCell={renderCell}
        hasColumnTools
        isStickyHeader
        maxHeight="22rem"
      />
    </div>
  );
}
