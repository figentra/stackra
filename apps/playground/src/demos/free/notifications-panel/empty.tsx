/**
 * Stackra file contract:
 * Purpose: the "empty" demo of the web NotificationsPanel: no notifications, so no badge, and the panel says what will
 *          appear there.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 13; ADR 0060
 *          (light, dark, RTL).
 */
import { NotificationsPanel, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { NOTIFICATIONS_PANEL_KEYS } from "#src/demos/free/notifications-panel/notifications-panel-keys.constant";

/** The demo's keys. */
const K = NOTIFICATIONS_PANEL_KEYS.notifications_panel;

/** Notifications panel: Empty. */
export default function Empty() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="flex justify-end">
      <NotificationsPanel items={[]} emptyState={t(K.empty)} />
    </div>
  );
}
