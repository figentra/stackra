/**
 * Stackra file contract:
 * Purpose: the "filters" demo of DataView: the and/or rule builder already holding a rule tree (Riyadh or Jeddah, and a total over 1,000 riyals), shown as removable chips.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import { DataView, useCollection } from "@stackra/ui/react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** DataView: Filters with the rule builder. */
export default function Filters() {
  const { orders, columns, renderCell, t, K } = useGulfOrders();
  const collection = useCollection({
    columns,
    items: orders,
    initialState: {
      filter: {
        match: "all",
        conditions: [{ id: "total", field: "total", operator: "greater", value: "1000" }],
        groups: [
          {
            id: "cities",
            match: "any",
            conditions: [
              { id: "riyadh", field: "city", operator: "equals", value: t(K.city_0) },
              { id: "jeddah", field: "city", operator: "equals", value: t(K.city_1) },
            ],
          },
        ],
      },
    },
  });
  return (
    <DataView
      label={t(K.filters_label)}
      collection={collection}
      renderCell={renderCell}
      layouts={["table", "cards"]}
      cards={{ title: "customer", subtitle: "order", meta: "total" }}
    />
  );
}
