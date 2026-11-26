/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native NotificationInbox block (@stackra/notifications): three notifications in
 *          place, two unread; pressing one reads it, a swipe dismisses it, and mark-all-read clears the unread marks.
 * Boundary: a demo with no props: the kit block and local state only, as an app would hold the inbox it loaded; every
 *           word from the catalogue. The same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); ADR 0504 (module UI kits).
 */
import { NotificationInbox } from "@stackra/notifications/native";
import type { NotificationItem } from "@stackra/ui/contracts";
import { useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NOTIFICATION_INBOX_DEMO_KEYS } from "#src/demos/free/notification-inbox/notification-inbox-demo-keys.constant";

/** The demo's keys. */
const K = NOTIFICATION_INBOX_DEMO_KEYS.demo_free.notification_inbox.basics;

/** Notification inbox: read, dismiss and mark all read. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [unread, setUnread] = useState<ReadonlySet<string>>(new Set(["paid", "stock"]));
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());
  // Only the ids live in state, so the words follow the locale.
  const all: readonly NotificationItem[] = [
    {
      id: "paid",
      tone: "success",
      title: t(K.order_paid),
      description: t(K.order_paid_detail),
      time: t(K.minutes_ago, { count: 5 }),
      group: t(K.today),
    },
    {
      id: "stock",
      tone: "warning",
      title: t(K.low_stock),
      time: t(K.hours_ago, { count: 2 }),
      group: t(K.today),
    },
    { id: "report", title: t(K.shift_report), group: t(K.yesterday) },
  ];
  const items = all
    .filter((item) => !dismissed.has(item.id))
    .map((item) => ({ ...item, isUnread: unread.has(item.id) }));
  const read = (id: string) =>
    setUnread((now) => new Set([...now].filter((other) => other !== id)));
  return (
    <View>
      <NotificationInbox
        items={items}
        isInline
        title={t(K.title)}
        emptyState={t(K.empty)}
        onItemPress={read}
        onDismiss={(id) => setDismissed((now) => new Set([...now, id]))}
        onMarkAllRead={() => setUnread(new Set())}
      />
    </View>
  );
}
