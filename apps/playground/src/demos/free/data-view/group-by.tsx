/**
 * Stackra file contract:
 * Purpose: the "group-by" demo of DataView: the orders grouped by city, each group with its count and riyal total, in the table and the cards.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import { DataView, useCollection } from "@stackra/ui/react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** DataView: Group by. */
export default function GroupBy() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(24);
  const collection = useCollection({
    columns,
    items: orders,
    initialState: { groupBy: "city", sort: [{ column: "total", direction: "descending" }] },
  });
  return (
    <DataView
      label={t(K.group_label)}
      collection={collection}
      renderCell={renderCell}
      cards={{ title: "customer", subtitle: "order", meta: "total" }}
    />
  );
}
