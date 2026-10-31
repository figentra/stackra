/**
 * Stackra file contract:
 * Purpose: the "rows" demo of DataView: every row tool of wave 3 under the whole toolbar: quick actions on hover and the
 *          same list on a right-click, the arrow that opens an order's details under it, an order opened in the side
 *          panel from the table, the list or a card, the customer and quantity edited in place with the DataGrid's
 *          editors, and "select all N" across pages for the bulk bar.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only; the demo writes the edited
 *           rows, the view never does.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29), wave 3 (rows); ADR 0060 (light, dark, RTL).
 */
import type { CollectionColumn, ResourceAction } from "@stackra/ui/contracts";
import { DataView, PropertyList, Text, useCollection } from "@stackra/ui/react";
import { useState } from "react";

import { Icons } from "#src/constants/icons.constant";
import type { GulfOrder } from "#src/demos/free/data-view/gulf-order.type";
import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** The columns shown in an order's detail row; the table hides them. */
const DETAIL = new Set(["city", "product", "channel", "status", "quantity", "total", "date"]);

/** The columns edited in place, with their rules. */
const EDITABLE: Readonly<Record<string, Partial<CollectionColumn>>> = {
  customer: { isEditable: true, isRequired: true },
  quantity: { isEditable: true, min: 1, isRequired: true },
};

/** DataView: Row tools. */
export default function Rows() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(40);
  const [edits, setEdits] = useState<Readonly<Record<string, Partial<GulfOrder>>>>({});
  const [last, setLast] = useState<string | null>(null);
  const items = orders.map((order) => ({ ...order, ...edits[order.id] }));
  const collection = useCollection({
    columns: columns.map((column) => ({ ...column, ...EDITABLE[column.id] })),
    items,
    paging: "page",
    initialState: {
      pageSize: 8,
      columns: columns.map((column) => ({
        id: column.id,
        isHidden: DETAIL.has(column.id),
        ...(column.id === "customer" ? { width: 200 } : {}),
      })),
    },
  });
  const labelOf = (id: string) => columns.find((column) => column.id === id)?.label ?? id;
  const actionsOf = (order: GulfOrder): readonly ResourceAction[] => [
    {
      id: "print",
      label: t(K.action_print),
      icon: Icons.Printer,
      onPress: () => setLast(`${t(K.action_print)} ${order.order}`),
    },
    {
      id: "refund",
      label: t(K.action_refund),
      icon: Icons.Undo2,
      onPress: () => setLast(`${t(K.action_refund)} ${order.order}`),
    },
    {
      id: "archive",
      label: t(K.action_archive),
      tone: "danger",
      onPress: () => setLast(`${t(K.action_archive)} ${order.order}`),
    },
  ];
  const fieldsOf = (order: GulfOrder, only?: ReadonlySet<string>) =>
    columns
      .filter((column) => !only || only.has(column.id))
      .map((column) => ({ id: column.id, label: column.label, value: renderCell(order, column) }));
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.rows_hint)}</Text>
      <DataView
        label={t(K.rows_label)}
        collection={collection}
        renderCell={renderCell}
        list={{ subtitle: "customer", meta: "total" }}
        cards={{ title: "customer", subtitle: "order", meta: "status", fields: ["city", "total"] }}
        rowActions={actionsOf}
        hasHoverActions
        bulkActions={[{ id: "tag", label: t(K.tag), onPress: () => setLast(t(K.tag)) }]}
        renderRowDetail={(order) => <PropertyList columns="auto" items={fieldsOf(order, DETAIL)} />}
        renderRowPanel={(order) => <PropertyList items={fieldsOf(order)} />}
        onCellEdit={(order, columnId, value) => {
          setEdits((current) => ({
            ...current,
            [order.id]: { ...current[order.id], [columnId]: value },
          }));
          setLast(
            t(K.edited, { order: order.order, field: labelOf(columnId), value: String(value) }),
          );
        }}
      />
      <Text role="status" tone="muted">
        {t(K.last_action, { text: last ?? t(K.none) })}
      </Text>
    </div>
  );
}
