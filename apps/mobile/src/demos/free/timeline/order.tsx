/**
 * Stackra file contract:
 * Purpose: the "order" demo of the native Timeline: an order's history from creation to payment, grouped by day.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Timeline, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";
import { Icons } from "#src/constants/icons.constant";

import { MESSAGES } from "#src/constants/messages.constant";
import { TIMELINE_DEMO_KEYS } from "#src/demos/free/timeline/timeline-demo-keys.constant";

const NOW = new Date("2026-10-29T12:00:00+03:00");

/** The demo's keys. */
const K = TIMELINE_DEMO_KEYS.demo_free.timeline.order;

/** Timeline: an order's history from creation to payment, grouped by day. */
export default function Order() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <Timeline
        label={t(K.label)}
        now={NOW}
        timeZone="Asia/Riyadh"
        items={[
          {
            id: "paid",
            actor: t(K.finance),
            title: t(K.paid),
            at: "2026-10-29T11:20:00+03:00",
            icon: Icons.CreditCard,
            tone: "success",
          },
          {
            id: "shipped",
            actor: t(K.warehouse),
            title: t(K.shipped),
            at: "2026-10-29T09:05:00+03:00",
            icon: Icons.Truck,
            tone: "accent",
            body: t(K.shipped_body),
          },
          {
            id: "approved",
            actor: "Sara Al-Qahtani",
            title: t(K.approved),
            at: "2026-10-28T16:40:00+03:00",
            icon: Icons.User,
          },
          {
            id: "edited",
            actor: "Omar Haddad",
            title: t(K.edited),
            at: "2026-10-28T10:15:00+03:00",
            icon: Icons.Pencil,
            body: t(K.edited_body),
          },
          { id: "created", title: t(K.created), at: "2026-10-26T08:00:00+03:00", icon: Icons.Plus },
        ]}
      />
    </View>
  );
}
