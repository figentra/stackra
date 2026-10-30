/**
 * Stackra file contract:
 * Purpose: the "widgets" demo of the web Sortable list: an admin dashboard's widgets; locking the layout hides every handle and refuses moves.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          design-system gap inventory (2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { Button, SortableList, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SORTABLE_LIST_KEYS } from "#src/demos/free/sortable-list/sortable-list-keys.constant";

/** The demo's keys. */
const K = SORTABLE_LIST_KEYS.sortable_list.widgets;

/** The widgets, in their first order. */
const WIDGETS = ["sales_today", "open_orders", "low_stock", "top_products"] as const;

/** Sortable list: Locked layout. */
export default function Widgets() {
  const t = useCatalogueText(MESSAGES.en);
  const [isLocked, setLocked] = useState(false);
  const [order, setOrder] = useState(() => WIDGETS.map((id) => ({ id, label: t(K[id]) })));
  return (
    <div className="grid max-w-md gap-3">
      <Button
        variant="secondary"
        startIcon={isLocked ? "lock-open" : "lock"}
        onPress={() => setLocked(!isLocked)}
        className="justify-self-start"
      >
        {isLocked ? t(K.unlock) : t(K.lock)}
      </Button>
      <SortableList
        label={t(K.label)}
        items={order}
        onReorder={(items) => setOrder([...items])}
        isDisabled={isLocked}
      />
    </div>
  );
}
