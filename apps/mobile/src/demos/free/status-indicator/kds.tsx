/**
 * Stackra file contract:
 * Purpose: the "kds" demo of the native StatusIndicator: kitchen display tickets with their age; the late ticket pulses
 *          for attention (unless motion is reduced), the others only show their shape.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); gap inventory row 30.
 */
import { Card, StatusIndicator, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { STATUS_INDICATOR_DEMO_KEYS } from "#src/demos/free/status-indicator/status-indicator-demo-keys.constant";

/** The demo's keys. */
const K = STATUS_INDICATOR_DEMO_KEYS.demo_free.status_indicator;

/** The tickets: number, items, minutes waiting and state. */
const TICKETS = [
  { id: "214", items: [K.shawarma, K.falafel], minutes: 19, tone: "danger", state: K.late },
  { id: "215", items: [K.latte], minutes: 7, tone: "warning", state: K.waiting },
  { id: "216", items: [K.kunafa], minutes: 2, tone: "success", state: K.ready },
] as const;

/** Kitchen tickets with their state. */
export default function Kds() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {TICKETS.map((ticket) => (
        <Card key={ticket.id} className="gap-2 p-4">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="font-semibold">{t(K.ticket, { id: ticket.id })}</Text>
            <Text tone="muted">{t(K.minutes, { count: ticket.minutes })}</Text>
          </View>
          {ticket.items.map((item) => (
            <Text key={item}>{t(item)}</Text>
          ))}
          <StatusIndicator tone={ticket.tone} isAttention={ticket.tone === "danger"}>
            {t(ticket.state)}
          </StatusIndicator>
        </Card>
      ))}
    </View>
  );
}
