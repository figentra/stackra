/**
 * Stackra file contract:
 * Purpose: the "points" demo of the web ScatterChart: orders by delivery time and rating, with the target rating as a reference line.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { ScatterChart, WidgetFrame, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SCATTER_CHART_KEYS } from "#src/demos/free/scatter-chart/scatter-chart-keys.constant";

/** The demo's keys. */
const K = SCATTER_CHART_KEYS.scatter_chart;

/** Forty orders: the longer the wait, the lower the rating, with some spread. */
const ORDERS = Array.from({ length: 40 }, (_, index) => {
  const minutes = 15 + ((index * 37) % 50);
  return {
    minutes,
    rating: Math.max(1, Math.min(5, 5.4 - minutes / 22 + ((index * 13) % 10) / 12)),
  };
});

/** Scatter chart: points. */
export default function Points() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <WidgetFrame
      className="w-full"
      size="full"
      title={t(K.points_title)}
      description={t(K.points_description)}
    >
      <ScatterChart
        data={ORDERS}
        series={[{ key: "orders", label: t(K.orders) }]}
        xKey="minutes"
        yKey="rating"
        xLabel={t(K.minutes)}
        yLabel={t(K.rating)}
        valueFormat={{ maximumFractionDigits: 1 }}
        references={[{ value: 4, label: t(K.target), color: "success" }]}
        label={t(K.points_title)}
      />
    </WidgetFrame>
  );
}
