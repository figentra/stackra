/**
 * Stackra file contract:
 * Purpose: the "activity" demo of the native CalendarHeatmap: orders every day from January to October 2026.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (charts wave 2).
 */
import { CalendarHeatmap, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CALENDAR_HEATMAP_DEMO_KEYS } from "#src/demos/free/calendar-heatmap/calendar-heatmap-demo-keys.constant";

/** The demo's keys. */
const K = CALENDAR_HEATMAP_DEMO_KEYS.demo_free.calendar_heatmap.activity;

/** Every day from 1 January to 31 October 2026, busier at weekends and in the autumn; some days closed. */
const DAYS = Array.from({ length: 304 }, (_, day) => {
  const date = new Date(Date.UTC(2026, 0, 1 + day));
  const weekend = date.getUTCDay() >= 4 && date.getUTCDay() <= 5 ? 8 : 0;
  return {
    date: date.toISOString().slice(0, 10),
    value: (day * 17) % 11 === 0 ? 0 : 4 + weekend + Math.round(day / 30) + ((day * 7) % 9),
  };
});

/** Orders every day. */
export default function Activity() {
  const t = useCatalogueText(MESSAGES.en);
  return <CalendarHeatmap values={DAYS} start="2026-01-01" end="2026-10-31" label={t(K.label)} />;
}
