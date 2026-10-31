/**
 * Stackra file contract:
 * Purpose: the "multi-sort" demo of the web DataTable: sorted by city, then by the largest total; each header shows its rank, and a header menu adds or removes a key.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import { DataTable, Text, useCollection } from "@stackra/ui/react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** Data table: Multi-sort. */
export default function MultiSort() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(16);
  const collection = useCollection({
    columns,
    items: orders,
    initialState: {
      sort: [
        { column: "city", direction: "ascending" },
        { column: "total", direction: "descending" },
      ],
    },
  });
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.multisort_hint)}</Text>
      <DataTable
        label={t(K.multisort_label)}
        collection={collection}
        renderCell={renderCell}
        hasColumnTools
        isStickyHeader
        maxHeight="22rem"
      />
    </div>
  );
}
