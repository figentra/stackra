/**
 * Stackra file contract:
 * Purpose: the "widgets" demo of the native SortableList: an admin dashboard's widgets; locking the layout hides every grip and refuses moves.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory (2026-10-28).
 */
import { Button, SortableList, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SORTABLE_LIST_DEMO_KEYS } from "#src/demos/free/sortable-list/sortable-list-demo-keys.constant";

/** The demo's keys. */
const K = SORTABLE_LIST_DEMO_KEYS.demo_free.sortable_list.widgets;

/** The widgets, in their first order. */
const WIDGETS = ["sales_today", "open_orders", "low_stock", "top_products"] as const;

/** The widgets, with a lock that freezes their order. */
export default function Widgets() {
  const t = useCatalogueText(MESSAGES.en);
  const [isLocked, setLocked] = useState(false);
  const [order, setOrder] = useState(() => WIDGETS.map((id) => ({ id, label: t(K[id]) })));
  return (
    <View className="gap-3">
      <Button
        size="sm"
        variant="secondary"
        startIcon={isLocked ? "lock-open" : "lock"}
        onPress={() => setLocked(!isLocked)}
      >
        {isLocked ? t(K.unlock) : t(K.lock)}
      </Button>
      <SortableList
        label={t(K.label)}
        items={order}
        onReorder={(items) => setOrder([...items])}
        isDisabled={isLocked}
      />
    </View>
  );
}
