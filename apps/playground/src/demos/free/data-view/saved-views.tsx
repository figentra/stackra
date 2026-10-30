/**
 * Stackra file contract:
 * Purpose: the "saved-views" demo of DataView: three saved views (waiting for payment, Riyadh largest first, WhatsApp orders, one shared) with save, save as, rename, share, make default and delete.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import { DataView, Text, useCollection } from "@stackra/ui/react";
import { useState } from "react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** DataView: Saved views. */
export default function SavedViews() {
  const { orders, columns, renderCell, t, K } = useGulfOrders();
  const [shared, setShared] = useState<string | null>(null);
  const collection = useCollection({
    columns,
    items: orders,
    paging: "page",
    initialState: { pageSize: 8 },
    views: [
      {
        id: "unpaid",
        label: t(K.view_unpaid),
        state: {
          filter: {
            match: "all",
            conditions: [{ id: "s", field: "status", operator: "equals", value: t(K.status_pending) }],
          },
        },
      },
      {
        id: "riyadh",
        label: t(K.view_riyadh),
        state: {
          filter: { match: "all", conditions: [{ id: "c", field: "city", operator: "equals", value: t(K.city_0) }] },
          sort: [{ column: "total", direction: "descending" }],
        },
        isShared: true,
      },
      {
        id: "whatsapp",
        label: t(K.view_whatsapp),
        state: {
          filter: {
            match: "all",
            conditions: [{ id: "w", field: "channel", operator: "equals", value: t(K.channel_whatsapp) }],
          },
          layout: "cards",
        },
      },
    ],
    defaultViewId: "riyadh",
  });
  return (
    <div className="grid gap-2">
      <DataView
        label={t(K.views_label)}
        collection={collection}
        renderCell={renderCell}
        onShareView={(view) => setShared(view.label)}
        cards={{ title: "customer", subtitle: "order", meta: "status" }}
      />
      {shared ? <Text tone="muted">{t(K.shared, { name: shared })}</Text> : null}
    </div>
  );
}
