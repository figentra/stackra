/**
 * Stackra file contract:
 * Purpose: the "resizable" demo of the web Split view: the border between the orders and their detail is a window
 *          splitter, dragged or moved with the arrow keys, Home and End, on the same pane engine as Sidebar and
 *          SidePanel; the status line reads the list pane's width.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); WAI-ARIA window splitter; STA-1371 (shared pane engine).
 */
import { Button, SplitView, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SPLIT_VIEW_KEYS } from "#src/demos/free/split-view/split-view-keys.constant";

/** The demo's keys. */
const K = SPLIT_VIEW_KEYS.split_view;

const ORDERS = ["1042", "1043", "1044"] as const;

/** Split view: Resizable. */
export default function Resizable() {
  const t = useCatalogueText(MESSAGES.en);
  const [order, setOrder] = useState<string>(ORDERS[0]);
  const [width, setWidth] = useState(220);
  return (
    <div className="grid w-full gap-3">
      <SplitView
        className="h-72 w-full rounded-[var(--radius-container)] border border-border"
        // The basics demo on the same page names its panes "Orders" and "Order details"; landmark names must differ.
        primaryLabel={t(K.orders_resizable)}
        secondaryLabel={t(K.details_resizable)}
        primaryWidth={220}
        isResizable
        minPrimaryWidth={180}
        maxPrimaryWidth={360}
        onPrimaryWidthChange={setWidth}
        isSecondaryShown
        primary={
          <ul className="grid gap-1 p-2">
            {ORDERS.map((number) => (
              <li key={number}>
                <Button
                  variant={number === order ? "secondary" : "ghost"}
                  isFullWidth
                  onPress={() => setOrder(number)}
                >
                  {t(K.order, { number })}
                </Button>
              </li>
            ))}
          </ul>
        }
        secondary={
          <div className="grid gap-2 p-4">
            <Text className="font-semibold">{t(K.order, { number: order })}</Text>
            <Text tone="muted">{t(K.ready)}</Text>
          </div>
        }
      />
      <Text role="status" type="small" tone="muted">
        <bdi>{t(K.width, { width })}</bdi>
      </Text>
    </div>
  );
}
