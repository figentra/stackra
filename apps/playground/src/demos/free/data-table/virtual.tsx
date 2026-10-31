/**
 * Stackra file contract:
 * Purpose: the "virtual" demo of the web DataTable: ten thousand orders with virtual scrolling. Only the rows in view are
 *          drawn; the header, the selection boxes and the order number (pinned to the start) stay in place, the column
 *          tools work, and a switch groups the rows by city, the group headings scrolling with the rows.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29), wave 4 (virtual scrolling for 10k+ rows); ADR 0060 (light, dark, RTL).
 */
import { DataTable, Switch, Text, useCollection } from "@stackra/ui/react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** How many orders the demo draws from. */
const COUNT = 10_000;

/** Data table: Ten thousand rows. */
export default function Virtual() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(COUNT);
  const collection = useCollection({
    columns,
    items: orders,
    initialState: {
      columns: columns.map((column) => ({
        id: column.id,
        ...(column.id === "order" ? { pin: "start" as const } : {}),
      })),
    },
  });
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.virtual_hint)}</Text>
      <Switch
        label={t(K.group_by_city)}
        value={collection.state.groupBy === "city"}
        onChange={(isOn) => collection.setGroupBy(isOn ? "city" : null)}
      />
      <DataTable
        label={t(K.virtual_label)}
        collection={collection}
        renderCell={renderCell}
        selectionMode="multiple"
        bulkActions={[{ id: "tag", label: t(K.tag) }]}
        hasColumnTools
        isVirtualized
        maxHeight="28rem"
      />
    </div>
  );
}
