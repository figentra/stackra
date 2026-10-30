/**
 * Stackra file contract:
 * Purpose: the "bubbles" demo of the native ScatterChart: products by price and units sold, sized by revenue, in two groups.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (charts wave 2).
 */
import { ScatterChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SCATTER_CHART_DEMO_KEYS } from "#src/demos/free/scatter-chart/scatter-chart-demo-keys.constant";

/** The demo's keys. */
const K = SCATTER_CHART_DEMO_KEYS.demo_free.scatter_chart.bubbles;

/** Twelve products: group, price in riyals and units sold this month. */
const PRODUCTS = [
  ["drinks", 12, 840],
  ["drinks", 15, 610],
  ["drinks", 18, 720],
  ["drinks", 22, 380],
  ["drinks", 9, 1020],
  ["drinks", 26, 260],
  ["food", 24, 410],
  ["food", 32, 300],
  ["food", 19, 560],
  ["food", 45, 150],
  ["food", 38, 210],
  ["food", 28, 340],
] as const;

/** Products as bubbles sized by revenue. */
export default function Bubbles() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ScatterChart
      data={PRODUCTS.map(([group, price, units]) => ({
        group,
        price,
        units,
        revenue: price * units,
      }))}
      series={[
        { key: "drinks", label: t(K.drinks) },
        { key: "food", label: t(K.food) },
      ]}
      palette="categorical"
      groupKey="group"
      xKey="price"
      yKey="units"
      sizeKey="revenue"
      xLabel={t(K.price)}
      yLabel={t(K.units)}
      sizeLabel={t(K.revenue)}
      label={t(K.bubbles_title)}
    />
  );
}
