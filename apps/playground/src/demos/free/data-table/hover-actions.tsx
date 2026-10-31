/**
 * Stackra file contract:
 * Purpose: the "hover-actions" demo of the web DataTable: one action list per order shown three ways: the icon actions
 *          as buttons revealed on hover or keyboard focus, every action in the row menu, and the same list on a
 *          right-click (or Shift+F10) anywhere on the row; the last action is read out under the table.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29), wave 3 (rows); ADR 0060 (light, dark, RTL).
 */
import type { ResourceAction } from "@stackra/ui/contracts";
import { DataTable, Text, useCollection } from "@stackra/ui/react";
import { useState } from "react";

import { Icons } from "#src/constants/icons.constant";
import type { GulfOrder } from "#src/demos/free/data-view/gulf-order.type";
import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** The columns this demo hides, so the actions stay in view. */
const HIDDEN = new Set(["city", "product", "channel", "quantity", "total", "date"]);

/** Data table: Hover and right-click actions. */
export default function HoverActions() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(6);
  const [last, setLast] = useState<string | null>(null);
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
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.hover_hint)}</Text>
      <DataTable
        label={t(K.hover_label)}
        collection={collection}
        renderCell={renderCell}
        rowActions={actionsOf}
        hasHoverActions
      />
      <Text role="status" tone="muted">
        {t(K.last_action, { text: last ?? t(K.none) })}
      </Text>
    </div>
  );
}
