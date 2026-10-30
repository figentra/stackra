/**
 * Stackra file contract:
 * Purpose: the "expandable-rows" demo of the web DataTable: each order opens under itself to show its product,
 *          channel, quantity and date, one at a time from the row's arrow or all at once from the header's button; the
 *          first order starts open.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29), wave 3 (rows); ADR 0060 (light, dark, RTL).
 */
import { DataTable, PropertyList, useCollection } from "@stackra/ui/react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** The columns the table hides: the detail row shows them. */
const HIDDEN = new Set(["city", "product", "channel", "status", "quantity", "date"]);

/** Data table: Expandable rows. */
export default function ExpandableRows() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(6);
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
  const details = columns.filter((column) => HIDDEN.has(column.id));
  return (
    <DataTable
      label={t(K.expand_label)}
      items={collection.rows}
      columns={collection.columns}
      collection={collection}
      renderCell={renderCell}
      query={{ search: "", filterValues: {}, sort: null }}
      onQueryChange={() => {}}
      defaultExpandedKeys={[orders[0]?.id ?? ""]}
      renderRowDetail={(order) => (
        <PropertyList
          columns="auto"
          items={details.map((column) => ({
            id: column.id,
            label: column.label,
            value: renderCell(order, column),
          }))}
        />
      )}
    />
  );
}
