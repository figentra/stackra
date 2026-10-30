/**
 * Stackra file contract:
 * Purpose: the "activity" demo of the web CalendarHeatmap: orders every day from January to October 2026, an activity graph.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { CalendarHeatmap, WidgetFrame, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CALENDAR_HEATMAP_KEYS } from "#src/demos/free/calendar-heatmap/calendar-heatmap-keys.constant";

/** The demo's keys. */
const K = CALENDAR_HEATMAP_KEYS.calendar_heatmap;

/** Every day from 1 January to 31 October 2026, busier at weekends and in the autumn; some days closed. */
const DAYS = Array.from({ length: 304 }, (_, day) => {
  const date = new Date(Date.UTC(2026, 0, 1 + day));
  const weekend = date.getUTCDay() >= 4 && date.getUTCDay() <= 5 ? 8 : 0;
  return {
    date: date.toISOString().slice(0, 10),
    value: (day * 17) % 11 === 0 ? 0 : 4 + weekend + Math.round(day / 30) + ((day * 7) % 9),
  };
});

/** Calendar heatmap: activity. */
export default function Activity() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <WidgetFrame
      className="w-full"
      size="full"
      title={t(K.activity_title)}
      description={t(K.activity_description)}
    >
      <CalendarHeatmap values={DAYS} start="2026-01-01" end="2026-10-31" label={t(K.label)} />
    </WidgetFrame>
  );
}
