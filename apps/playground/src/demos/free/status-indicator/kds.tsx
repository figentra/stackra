/**
 * Stackra file contract:
 * Purpose: the "kds" demo of the web StatusIndicator: kitchen display tickets with their age; the late ticket pulses
 *          for attention (unless motion is reduced), the others only show their shape.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 30; ADR 0060
 *          (light, dark, RTL).
 */
import { Card, StatusIndicator, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { STATUS_INDICATOR_KEYS } from "#src/demos/free/status-indicator/status-indicator-keys.constant";

/** The demo's keys. */
const K = STATUS_INDICATOR_KEYS.status_indicator;

/** The tickets: number, items, minutes waiting and state. */
const TICKETS = [
  { id: "214", items: [K.shawarma, K.falafel], minutes: 19, tone: "danger", state: K.late },
  { id: "215", items: [K.latte], minutes: 7, tone: "warning", state: K.waiting },
  { id: "216", items: [K.kunafa], minutes: 2, tone: "success", state: K.ready },
] as const;

/** Status indicator: Kitchen display. */
export default function Kds() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {TICKETS.map((ticket) => (
        <li key={ticket.id}>
          <Card className="grid gap-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <Text className="font-semibold">{t(K.ticket, { id: ticket.id })}</Text>
              <Text tone="muted">{t(K.minutes, { count: ticket.minutes })}</Text>
            </div>
            {ticket.items.map((item) => (
              <Text key={item}>{t(item)}</Text>
            ))}
            <StatusIndicator tone={ticket.tone} isAttention={ticket.tone === "danger"}>
              {t(ticket.state)}
            </StatusIndicator>
          </Card>
        </li>
      ))}
    </ul>
  );
}
