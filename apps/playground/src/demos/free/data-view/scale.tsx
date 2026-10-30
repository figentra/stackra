/**
 * Stackra file contract:
 * Purpose: the "scale" demo of DataView: ten thousand orders in every view with virtual scrolling. The table, the list,
 *          the cards and the board each draw only what is on screen; the toolbar's search, filter, sort and group work
 *          over all ten thousand.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29), wave 4 (scale); ADR 0060 (light, dark, RTL).
 */
import { DataView, Text, useCollection } from "@stackra/ui/react";
import { useState } from "react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** DataView: Ten thousand rows in every view. */
export default function Scale() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(10_000);
  const [statuses, setStatuses] = useState<Readonly<Record<string, string>>>({});
  const items = orders.map((order) =>
    statuses[order.id] ? { ...order, status: statuses[order.id] ?? order.status } : order,
  );
  const collection = useCollection({ columns, items });
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.scale_hint)}</Text>
      <DataView
        label={t(K.scale_label)}
        collection={collection}
        renderCell={renderCell}
        isVirtualized
        cards={{ title: "customer", subtitle: "order", meta: "total", fields: ["city", "status"] }}
        list={{ title: "customer", subtitle: "order", meta: "total" }}
        board={{
          field: "status",
          card: { title: "customer", subtitle: "order", meta: "total", fields: ["city"] },
          onMove: (order, status) => setStatuses((current) => ({ ...current, [order.id]: status })),
        }}
        bulkActions={[{ id: "tag", label: t(K.tag) }]}
      />
    </div>
  );
}
