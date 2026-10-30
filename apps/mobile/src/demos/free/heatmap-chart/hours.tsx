/**
 * Stackra file contract:
 * Purpose: the "hours" demo of the native HeatmapChart: orders by weekday and hour, shaded from quiet to busy.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (charts wave 2).
 */
import { HeatmapChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { HEATMAP_CHART_DEMO_KEYS } from "#src/demos/free/heatmap-chart/heatmap-chart-demo-keys.constant";

/** The demo's keys. */
const K = HEATMAP_CHART_DEMO_KEYS.demo_free.heatmap_chart.hours;

/** The week from Sunday, and six opening hours. */
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const HOURS = [10, 12, 14, 16, 18, 20];

/** Orders by weekday and hour. */
export default function Hours() {
  const t = useCatalogueText(MESSAGES.en);
  const data = DAYS.flatMap((day, row) =>
    HOURS.map((hour) => ({
      day: t(K[day]),
      hour: String(hour),
      orders: Math.round(
        (40 * Math.exp(-((hour - 13) ** 2) / 3) + 55 * Math.exp(-((hour - 18) ** 2) / 4)) *
          (row >= 4 ? 1.4 : 1) +
          ((row * 7 + hour * 3) % 9),
      ),
    })),
  );
  return <HeatmapChart data={data} xKey="hour" yKey="day" valueKey="orders" label={t(K.label)} />;
}
