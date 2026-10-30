/**
 * Stackra file contract:
 * Purpose: the "points" demo of the native ScatterChart: orders by delivery time and rating, with the target rating as
 *          a reference line.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (charts wave 2).
 */
import { ScatterChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SCATTER_CHART_DEMO_KEYS } from "#src/demos/free/scatter-chart/scatter-chart-demo-keys.constant";

/** The demo's keys. */
const K = SCATTER_CHART_DEMO_KEYS.demo_free.scatter_chart.points;

/** Forty orders: the longer the wait, the lower the rating, with some spread. */
const ORDERS = Array.from({ length: 40 }, (_, index) => {
  const minutes = 15 + ((index * 37) % 50);
  return {
    minutes,
    rating: Math.max(1, Math.min(5, 5.4 - minutes / 22 + ((index * 13) % 10) / 12)),
  };
});

/** Orders by delivery time and rating. */
export default function Points() {
  const t = useCatalogueText(MESSAGES.en);
  return (
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
  );
}
