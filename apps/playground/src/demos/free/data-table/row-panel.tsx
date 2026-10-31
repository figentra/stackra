/**
 * Stackra file contract:
 * Purpose: the "row-panel" demo of the web DataTable: a pressed order opens in the shared side panel beside the table
 *          (a drawer on a phone), resizable from its edge, expandable and closable from its header; focus goes back to
 *          the row on close.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29), wave 3 (rows); ADR 0060 (light, dark, RTL).
 */
import { DataTable, PropertyList, Text, useCollection } from "@stackra/ui/react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** The columns the table hides: the panel shows every one. */
const HIDDEN = new Set(["city", "product", "channel", "status", "quantity", "date"]);

/** Data table: Open a row in a side panel. */
export default function RowPanel() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(8);
  const collection = useCollection({
    columns,
    items: orders,
    initialState: {
      columns: columns.map((column) => ({
        id: column.id,
        isHidden: HIDDEN.has(column.id),
        ...(column.id === "customer" ? { width: 200 } : {}),
      })),
    },
  });
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.panel_hint)}</Text>
      <DataTable
        label={t(K.panel_label)}
        collection={collection}
        renderCell={renderCell}
        renderRowPanel={(order) => (
          <PropertyList
            items={columns.map((column) => ({
              id: column.id,
              label: column.label,
              value: renderCell(order, column),
            }))}
          />
        )}
      />
    </div>
  );
}
