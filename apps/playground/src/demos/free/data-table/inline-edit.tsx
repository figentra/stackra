/**
 * Stackra file contract:
 * Purpose: the "inline-edit" demo of the web DataTable: the customer (required text), the status (a choice) and the
 *          quantity (a whole number from 1) are edited in place with the DataGrid's own editors and rules; Enter saves,
 *          Escape cancels, a bad value keeps the editor open and says why, and the last change is read out.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only; the table never writes a
 *           row, the demo does from `onCellEdit`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29), wave 3 (rows); ADR 0060 (light, dark, RTL).
 */
import type { DataGridColumn } from "@stackra/ui/contracts";
import { DataTable, Text, useCollection } from "@stackra/ui/react";
import { useState } from "react";

import type { GulfOrder } from "#src/demos/free/data-view/gulf-order.type";
import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** The columns this demo hides, so the edited ones stay in view. */
const HIDDEN = new Set(["city", "product", "channel", "total", "date"]);

/** Data table: Inline edit. */
export default function InlineEdit() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(6);
  const [edits, setEdits] = useState<Readonly<Record<string, Partial<GulfOrder>>>>({});
  const [last, setLast] = useState<string | null>(null);
  const items = orders.map((order) => ({ ...order, ...edits[order.id] }));
  const collection = useCollection({
    columns,
    items,
    initialState: {
      columns: columns.map((column) => ({
        id: column.id,
        isHidden: HIDDEN.has(column.id),
        ...(column.id === "customer" ? { width: 200 } : {}),
      })),
    },
  });
  const labelOf = (id: string) => columns.find((column) => column.id === id)?.label ?? id;
  const statuses = columns.find((column) => column.id === "status")?.options ?? [];
  const editable: readonly DataGridColumn[] = [
    { id: "customer", label: labelOf("customer"), isRequired: true },
    { id: "status", label: labelOf("status"), type: "select", options: statuses },
    { id: "quantity", label: labelOf("quantity"), type: "number", min: 1, isRequired: true },
  ];
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.edit_hint)}</Text>
      <DataTable
        label={t(K.edit_label)}
        items={collection.rows}
        columns={collection.columns}
        collection={collection}
        renderCell={renderCell}
        query={{ search: "", filterValues: {}, sort: null }}
        onQueryChange={() => {}}
        editableColumns={editable}
        onCellEdit={(order, columnId, value) => {
          // A quantity changes the total too.
          const unit = order.total / Math.max(1, order.quantity);
          const patch =
            columnId === "quantity" && typeof value === "number"
              ? { quantity: value, total: Math.round(unit * value) }
              : { [columnId]: value };
          setEdits((current) => ({ ...current, [order.id]: { ...current[order.id], ...patch } }));
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
