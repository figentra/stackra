/**
 * Stackra file contract:
 * Purpose: the "virtual" demo of the web List: ten thousand customers' orders as pressable rows with virtual scrolling.
 *          Only the rows in view are drawn; the arrow keys walk every row and Enter opens one, which is read out.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29), wave 4 (virtual scrolling for 10k+ rows); ADR 0060 (light, dark, RTL).
 */
import { List, Text } from "@stackra/ui/react";
import { useState } from "react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** List: Ten thousand rows. */
export default function Virtual() {
  const { orders, t, K } = useGulfOrders(10_000);
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="grid gap-3">
      <Text tone="muted">{t(K.list_virtual_hint)}</Text>
      <List
        label={t(K.list_virtual_label)}
        isVirtualized
        maxHeight="26rem"
        items={orders.map((order) => ({
          id: order.id,
          title: order.customer,
          description: `${order.order} · ${order.city}`,
          endContent: t(K.amount, { amount: order.total }),
          hasChevron: true,
          onPress: () => setLast(order.order),
        }))}
      />
      <Text role="status" tone="muted">
        {t(K.last_action, { text: last ?? t(K.none) })}
      </Text>
    </div>
  );
}
