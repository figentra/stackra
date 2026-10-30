/**
 * Stackra file contract:
 * Purpose: the "aggregates" demo of the web DataTable: a footer row that sticks to the bottom with the sums of the number columns, by default; each column's menu picks its summary, and anything but a sum is named in its cell.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import { DataTable, useCollection } from "@stackra/ui/react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** Data table: Aggregates footer. */
export default function Aggregates() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(30);
  // The footer's defaults: the total's own sum, every other number column summed, nothing under text.
  const collection = useCollection({ columns, items: orders, initialState: {
      // The totals in view: the long text columns are hidden (the column editor can show them).
      columns: columns.map((column) => ({ id: column.id, isHidden: ["city", "product", "channel", "date"].includes(column.id) })),
    } });
  return (
    <div className="grid gap-3">
      
      <DataTable
        label={t(K.aggregates_label)}
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
