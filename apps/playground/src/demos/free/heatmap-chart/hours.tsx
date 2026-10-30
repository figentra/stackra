/**
 * Stackra file contract:
 * Purpose: the "hours" demo of the web HeatmapChart: orders by weekday and hour, shaded from quiet to busy.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { HeatmapChart, WidgetFrame, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { HEATMAP_CHART_KEYS } from "#src/demos/free/heatmap-chart/heatmap-chart-keys.constant";

/** The demo's keys. */
const K = HEATMAP_CHART_KEYS.heatmap_chart;

/** The week from Sunday, and the opening hours. */
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const HOURS = Array.from({ length: 12 }, (_, index) => 8 + index);

/** Heatmap chart: hours. */
export default function Hours() {
  const t = useCatalogueText(MESSAGES.en);
  const data = DAYS.flatMap((day, row) =>
    HOURS.map((hour) => ({
      day: t(K[day]),
      hour: String(hour).padStart(2, "0"),
      // A lunch and an evening rush, busier at the weekend.
      orders: Math.round(
        (40 * Math.exp(-((hour - 13) ** 2) / 3) + 55 * Math.exp(-((hour - 18) ** 2) / 4)) *
          (row >= 4 ? 1.4 : 1) +
          ((row * 7 + hour * 3) % 9),
      ),
    })),
  );
  return (
    <WidgetFrame
      className="w-full"
      size="full"
      title={t(K.hours_title)}
      description={t(K.hours_description)}
    >
      <HeatmapChart data={data} xKey="hour" yKey="day" valueKey="orders" label={t(K.label)} />
    </WidgetFrame>
  );
}
