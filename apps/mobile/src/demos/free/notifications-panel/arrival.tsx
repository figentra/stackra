/**
 * Stackra file contract:
 * Purpose: the "arrival" demo of the native NotificationsPanel: each press adds a new online order, so the bell wiggles
 *          (unless motion is reduced) and a notification haptic plays.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); gap inventory row 13.
 */
import type { NotificationItem } from "@stackra/ui/contracts";
import { Button, NotificationsPanel, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NOTIFICATIONS_PANEL_DEMO_KEYS } from "#src/demos/free/notifications-panel/notifications-panel-demo-keys.constant";

/** The demo's keys. */
const K = NOTIFICATIONS_PANEL_DEMO_KEYS.demo_free.notifications_panel;

/** The first order number the demo hands out. */
const FIRST_ORDER = 1043;

/** Receive an order and watch the bell. */
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
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-row gap-2">
        <Button size="sm" variant="secondary" onPress={() => setCount((now) => now + 1)}>
          {t(K.simulate)}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onPress={() => {
            setCount(0);
            setReadUpTo(0);
          }}
        >
          {t(K.reset)}
        </Button>
      </View>
      <NotificationsPanel items={items} onMarkAllRead={() => setReadUpTo(count)} />
    </View>
  );
}
