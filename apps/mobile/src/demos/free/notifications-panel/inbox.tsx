/**
 * Stackra file contract:
 * Purpose: the "inbox" demo of the native NotificationsPanel: a store manager's inbox, open in place, with stock, order,
 *          refund and shift notifications under Today and Yesterday; tap one to read it, swipe or close one to dismiss
 *          it, and mark-all-read clears the unread marks.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); gap inventory row 13.
 */
import type { NotificationItem } from "@stackra/ui/contracts";
import { NotificationsPanel, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NOTIFICATIONS_PANEL_DEMO_KEYS } from "#src/demos/free/notifications-panel/notifications-panel-demo-keys.constant";

/** The demo's keys. */
const K = NOTIFICATIONS_PANEL_DEMO_KEYS.demo_free.notifications_panel;

/** The inbox in place: read, swipe away or mark everything read. */
export default function Inbox() {
  const t = useCatalogueText(MESSAGES.en);
  const [unread, setUnread] = useState<readonly string[]>(["stock", "order"]);
  const [removed, setRemoved] = useState<readonly string[]>([]);
  // Built on every render, so the words follow the locale; only the ids live in state.
  const all: readonly NotificationItem[] = [
    {
      id: "stock",
      tone: "warning",
      title: t(K.low_stock_title),
      description: t(K.low_stock_detail),
      time: t(K.minutes_ago, { count: 5 }),
      group: t(K.today),
    },
    {
      id: "order",
      tone: "accent",
      title: t(K.order_title, { id: "1042" }),
      description: t(K.order_detail),
      time: t(K.minutes_ago, { count: 12 }),
      group: t(K.today),
    },
    {
      id: "refund",
      tone: "success",
      title: t(K.refund_title),
      description: t(K.refund_detail),
      time: t(K.minutes_ago, { count: 48 }),
      group: t(K.today),
    },
    {
      id: "shift",
      title: t(K.shift_title),
      description: t(K.shift_detail),
      time: t(K.yesterday_at, { time: "11:40 PM" }),
      group: t(K.yesterday),
    },
  ];
  const items = all
    .filter((item) => !removed.includes(item.id))
    .map((item) => ({ ...item, isUnread: unread.includes(item.id) }));
  return (
    <View className="w-full">
      <NotificationsPanel
        isInline
        items={items}
        onItemPress={(id) => setUnread((now) => now.filter((each) => each !== id))}
        onDismiss={(id) => setRemoved((now) => [...now, id])}
        onMarkAllRead={() => setUnread([])}
      />
    </View>
  );
}
