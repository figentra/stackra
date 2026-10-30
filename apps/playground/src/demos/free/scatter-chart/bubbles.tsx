/**
 * Stackra file contract:
 * Purpose: the "bubbles" demo of the web ScatterChart: products by price and units sold, sized by revenue, in two groups.
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

/** Twelve products: price in riyals, units sold this month, and the revenue they made. */
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

/** Scatter chart: bubbles. */
export default function Bubbles() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <WidgetFrame
      className="w-full"
      size="full"
      title={t(K.bubbles_title)}
      description={t(K.bubbles_description)}
      menu={["png", "fullscreen"]}
    >
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
        // Two groups told apart by hue, not only lightness: the opt-in categorical set.
        palette="categorical"
        groupKey="group"
        xKey="price"
        yKey="units"
        sizeKey="revenue"
        xLabel={t(K.price)}
        yLabel={t(K.units)}
        sizeLabel={t(K.revenue)}
        xFormat={{ style: "currency", currency: "SAR", maximumFractionDigits: 0 }}
        label={t(K.bubbles_title)}
      />
    </WidgetFrame>
  );
}
