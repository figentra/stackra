/**
 * Stackra file contract:
 * Purpose: the "virtual" demo of the web DataGrid: ten thousand orders as editable typed cells. Only the rows in view are
 *          drawn (the grid's own virtualisation); the arrows, Page Up and Page Down walk every row, the order column is
 *          frozen and the edits collect in the save bar.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only; saving applies the changes
 *           to the demo's rows.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29), wave 4 (virtual scrolling for 10k+ rows); ADR 0060 (light, dark, RTL).
 */
import type { DataGridColumn, DataGridRow } from "@stackra/ui/contracts";
import { DataGrid, Text } from "@stackra/ui/react";
import { useState } from "react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** DataGrid: Ten thousand rows. */
export default function Virtual() {
  const { orders, columns, t, K } = useGulfOrders(10_000);
  const [edits, setEdits] = useState<Readonly<Record<string, Partial<DataGridRow>>>>({});
  const statuses = columns.find((column) => column.id === "status")?.options ?? [];
  const gridColumns: readonly DataGridColumn[] = [
    { id: "order", label: t(K.column_order), isReadOnly: true, width: 112 },
    { id: "customer", label: t(K.column_customer), isRequired: true, width: 240 },
    { id: "status", label: t(K.column_status), type: "select", options: statuses, width: 160 },
    { id: "quantity", label: t(K.column_quantity), type: "number", min: 1, width: 120 },
    { id: "total", label: t(K.column_total), type: "number", min: 0, width: 150 },
    { id: "date", label: t(K.column_date), type: "date", width: 170 },
  ];
  const rows = orders.map((order) => ({ ...order, ...edits[order.id] }) as DataGridRow);
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.grid_virtual_hint)}</Text>
      <DataGrid
        label={t(K.grid_virtual_label)}
        columns={gridColumns}
        rows={rows}
        frozenColumns={1}
        height="28rem"
        onSave={(changes) =>
          setEdits((current) => {
            const next = { ...current };
            for (const [id, change] of Object.entries(changes))
              next[id] = { ...next[id], ...change };
            return next;
          })
        }
      />
    </div>
  );
}
