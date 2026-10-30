/**
 * Stackra file contract:
 * Purpose: the "menu" demo of the native SortableList: a POS menu's categories reordered by dragging the grip, with a haptic on pickup and on each slot, or with the Move up and Move down actions of a screen reader.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory (2026-10-28).
 */
import { SortableList, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SORTABLE_LIST_DEMO_KEYS } from "#src/demos/free/sortable-list/sortable-list-demo-keys.constant";

/** The demo's keys. */
const K = SORTABLE_LIST_DEMO_KEYS.demo_free.sortable_list.menu;

/** The categories and how many items each holds. */
const START = [
  { id: "hot", count: 14 },
  { id: "cold", count: 9 },
  { id: "pastries", count: 11 },
  { id: "sandwiches", count: 6 },
  { id: "desserts", count: 4 },
] as const;

/** The categories, and their order written under them. */
export default function Menu() {
  const t = useCatalogueText(MESSAGES.en);
  const [order, setOrder] = useState(() =>
    START.map(({ id, count }) => ({ id, label: t(K[id]), description: t(K.items, { count }) })),
  );
  return (
    <View className="gap-3">
      <SortableList label={t(K.label)} items={order} onReorder={(items) => setOrder([...items])} />
      <Text tone="muted">{t(K.order, { list: order.map((row) => row.label).join(" · ") })}</Text>
    </View>
  );
}
