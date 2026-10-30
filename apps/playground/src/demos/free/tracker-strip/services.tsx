/**
 * Stackra file contract:
 * Purpose: the "services" demo of the web TrackerStrip: a status page of three services over the last 30 days, the
 *          payments service with an outage; each strip works out its own uptime.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Card, TrackerStrip, useCatalogueText, useDesignSystem } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TRACKER_STRIP_KEYS } from "#src/demos/free/tracker-strip/tracker-strip-keys.constant";

/** The demo's keys. */
const K = TRACKER_STRIP_KEYS.tracker_strip;

/** Each service's days that were not up: the day's index (0 is 30 days ago) and its state. */
const INCIDENTS = {
  api: { 12: "degraded" },
  dashboard: {},
  payments: { 8: "degraded", 21: "down", 22: "degraded" },
} as const;

/** Tracker strip: a status page. */
export default function Services() {
  const t = useCatalogueText(MESSAGES.en);
  const { locale } = useDesignSystem();
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const cellsOf = (incidents: Readonly<Record<number, "degraded" | "down">>) =>
    Array.from({ length: 30 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 9, 29 - 29 + index));
      const status: "up" | "degraded" | "down" = incidents[index] ?? "up";
      return {
        key: date.toISOString().slice(0, 10),
        label: day.format(date),
        status,
        note:
          status === "down" ? t(K.outage) : status === "degraded" ? t(K.slow_checkout) : undefined,
      };
    });
  return (
    <Card className="w-full">
      <Card.Header>
        <div className="grid gap-1">
          <Card.Title>{t(K.services_title)}</Card.Title>
          <Card.Description>{t(K.services_description)}</Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="grid gap-6">
        <TrackerStrip cells={cellsOf(INCIDENTS.api)} label={t(K.api)} height={24} />
        <TrackerStrip cells={cellsOf(INCIDENTS.dashboard)} label={t(K.dashboard)} height={24} />
        <TrackerStrip
          cells={cellsOf(INCIDENTS.payments)}
          label={t(K.payments)}
          height={24}
          startLabel={t(K.days_ago, { count: 30 })}
          endLabel={t(K.today)}
        />
      </Card.Content>
    </Card>
  );
}
