/**
 * Stackra file contract:
 * Purpose: the "row-reorder" demo of the web DataTable: eight orders put in packing order by dragging a row's handle,
 *          or from the keyboard (focus the handle, Enter, the arrows, Enter), with the new order read out under it.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only; the table moves nothing
 *           until `onReorder` hands the rows back.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29), wave 3 (rows); ADR 0060 (light, dark, RTL).
 */
import { DataTable, Text, useCollection } from "@stackra/ui/react";
import { useState } from "react";

import type { GulfOrder } from "#src/demos/free/data-view/gulf-order.type";
import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** The columns this demo hides, so the rows fit. */
const HIDDEN = new Set(["city", "product", "channel", "status", "quantity", "date"]);

/** Data table: Reorder rows. */
export default function RowReorder() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(8);
  const [rows, setRows] = useState<readonly GulfOrder[] | null>(null);
  const items = rows ?? orders;
  const collection = useCollection({
    columns,
    items,
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
      <Text tone="muted">{t(K.row_reorder_hint)}</Text>
      <DataTable
        label={t(K.row_reorder_label)}
        items={collection.rows}
        columns={collection.columns}
        collection={collection}
        renderCell={renderCell}
        query={{ search: "", filterValues: {}, sort: null }}
        onQueryChange={() => {}}
        onReorder={setRows}
      />
      <Text role="status" tone="muted">
        {t(K.packing_order, {
          orders: items.map((order) => `\u2068${order.order}\u2069`).join(" · "),
        })}
      </Text>
    </div>
  );
}
