/**
 * Stackra file contract:
 * Purpose: the "board" demo of DataView: forty orders as kanban columns by status. A card moves by drag and drop (pointer
 *          or keyboard) or from its menu; the demo writes the new status, and the last move is read out.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29), wave 4 (Board view); ADR 0060 (light, dark, RTL).
 */
import { DataView, Text, useCollection } from "@stackra/ui/react";
import { useState } from "react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** Orders on a board by status; moving a card changes its status and logs the move. */
export default function Board() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(40);
  const [statuses, setStatuses] = useState<Readonly<Record<string, string>>>({});
  const [last, setLast] = useState<string | null>(null);
  const items = orders.map((order) => ({ ...order, status: statuses[order.id] ?? order.status }));
  const collection = useCollection({ columns, items, initialState: { layout: "board" } });
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.board_hint)}</Text>
      <DataView
        label={t(K.board_label)}
        collection={collection}
        renderCell={renderCell}
        cards={{ title: "customer", subtitle: "order", meta: "total", fields: ["city"] }}
        board={{
          field: "status",
          onMove: (order, status) => {
            setStatuses((current) => ({ ...current, [order.id]: status }));
            setLast(t(K.moved, { order: order.order, status }));
          },
        }}
      />
      <Text role="status" tone="muted">
        {t(K.last_action, { text: last ?? t(K.none) })}
      </Text>
    </div>
  );
}
