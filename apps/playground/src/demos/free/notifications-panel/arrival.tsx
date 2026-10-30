/**
 * Stackra file contract:
 * Purpose: the "arrival" demo of the web NotificationsPanel: each press adds a new online order, so the bell wiggles and
 *          the badge bumps (unless motion is reduced); past 99 the badge reads 99+.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 13; ADR 0060
 *          (light, dark, RTL).
 */
import type { NotificationItem } from "@stackra/ui/contracts";
import { Button, NotificationsPanel, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { NOTIFICATIONS_PANEL_KEYS } from "#src/demos/free/notifications-panel/notifications-panel-keys.constant";

/** The demo's keys. */
const K = NOTIFICATIONS_PANEL_KEYS.notifications_panel;

/** The first order number the demo hands out. */
const FIRST_ORDER = 1043;

/** Notifications panel: New arrivals. */
export default function Arrival() {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(0);
  const [readUpTo, setReadUpTo] = useState(0);
  // Newest first; only the count lives in state, so the words follow the locale.
  const items: readonly NotificationItem[] = Array.from({ length: count }, (_, index) => {
    const order = count - 1 - index;
    return {
      id: String(FIRST_ORDER + order),
      tone: "accent",
      title: t(K.order_title, { id: String(FIRST_ORDER + order) }),
      description: t(K.order_detail),
      time: t(K.minutes_ago, { count: index }),
      group: t(K.today),
      isUnread: order >= readUpTo,
    };
  });
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex gap-2">
        <Button variant="secondary" onPress={() => setCount((now) => now + 1)}>
          {t(K.simulate)}
        </Button>
        <Button
          variant="ghost"
          onPress={() => {
            setCount(0);
            setReadUpTo(0);
          }}
        >
          {t(K.reset)}
        </Button>
      </div>
      <NotificationsPanel items={items} onMarkAllRead={() => setReadUpTo(count)} />
    </div>
  );
}
