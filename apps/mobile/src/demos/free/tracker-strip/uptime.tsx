/**
 * Stackra file contract:
 * Purpose: the "uptime" demo of the native TrackerStrip: an API's last 90 days, one cell a day, with a slow day, an
 *          outage, a maintenance window and a few days without data; press a day to read it.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371.
 */
import { TrackerStrip, useCatalogueText, useDesignSystem } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TRACKER_STRIP_DEMO_KEYS } from "#src/demos/free/tracker-strip/tracker-strip-demo-keys.constant";

/** The demo's keys. */
const K = TRACKER_STRIP_DEMO_KEYS.demo_free.tracker_strip.uptime;

/** An API's uptime. */
export default function Uptime() {
  const t = useCatalogueText(MESSAGES.en);
  const { locale } = useDesignSystem();
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const cells = Array.from({ length: 90 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 9, 29 - 89 + index));
    const note =
      index === 23
        ? t(K.slow_checkout)
        : index === 61
          ? t(K.outage)
          : index === 74
            ? t(K.maintenance)
            : undefined;
    return {
      key: date.toISOString().slice(0, 10),
      label: day.format(date),
      status: index < 3 ? "none" : index === 61 ? "down" : note ? "degraded" : "up",
      note,
    } as const;
  });
  return (
    <TrackerStrip
      cells={cells}
      label={t(K.label)}
      startLabel={t(K.days_ago, { count: 90 })}
      endLabel={t(K.today)}
    />
  );
}
