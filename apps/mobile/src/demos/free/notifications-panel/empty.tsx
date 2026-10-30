/**
 * Stackra file contract:
 * Purpose: the "empty" demo of the native NotificationsPanel: no notifications, so no badge, and the sheet says what
 *          will appear there.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); gap inventory row 13.
 */
import { NotificationsPanel, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NOTIFICATIONS_PANEL_DEMO_KEYS } from "#src/demos/free/notifications-panel/notifications-panel-demo-keys.constant";

/** The demo's keys. */
const K = NOTIFICATIONS_PANEL_DEMO_KEYS.demo_free.notifications_panel;

/** An empty inbox. */
export default function Empty() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row justify-end">
      <NotificationsPanel items={[]} emptyState={t(K.empty)} />
    </View>
  );
}
