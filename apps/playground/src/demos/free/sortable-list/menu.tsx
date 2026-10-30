/**
 * Stackra file contract:
 * Purpose: the "menu" demo of the web Sortable list: a POS menu's categories, reordered by dragging a handle or with Enter and the arrow keys; the new order is written under the list.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          design-system gap inventory (2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { SortableList, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SORTABLE_LIST_KEYS } from "#src/demos/free/sortable-list/sortable-list-keys.constant";

/** The demo's keys. */
const K = SORTABLE_LIST_KEYS.sortable_list.menu;

/** The categories and how many items each holds. */
const START = [
  { id: "hot", count: 14 },
  { id: "cold", count: 9 },
  { id: "pastries", count: 11 },
  { id: "sandwiches", count: 6 },
  { id: "desserts", count: 4 },
] as const;

/** Sortable list: Menu categories. */
export default function Menu() {
  const t = useCatalogueText(MESSAGES.en);
  const [order, setOrder] = useState(() =>
    START.map(({ id, count }) => ({
      id,
      label: t(K[id]),
      description: t(K.items, { count }),
    })),
  );
  return (
    <div className="grid max-w-md gap-3">
      <SortableList label={t(K.label)} items={order} onReorder={(items) => setOrder([...items])} />
      <Text tone="muted">{t(K.order, { list: order.map((row) => row.label).join(" · ") })}</Text>
    </div>
  );
}
