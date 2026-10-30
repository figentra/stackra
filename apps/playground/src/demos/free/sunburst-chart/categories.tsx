/**
 * Stackra file contract:
 * Purpose: the "categories" demo of the web SunburstChart: a quarter's revenue by category, then by product.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { SunburstChart, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SUNBURST_CHART_KEYS } from "#src/demos/free/sunburst-chart/sunburst-chart-keys.constant";

/** The demo's keys. */
const K = SUNBURST_CHART_KEYS.sunburst_chart;

/** Each category and its products' revenue. */
const TREE = [
  [
    "drinks",
    [
      ["coffee", 42_000],
      ["tea", 9000],
      ["juice", 6000],
    ],
  ],
  [
    "food",
    [
      ["bakery", 23_000],
      ["sandwiches", 14_000],
    ],
  ],
  [
    "retail",
    [
      ["beans", 15_000],
      ["merch", 8000],
    ],
  ],
] as const;

/** Sunburst chart: categories. */
export default function Categories() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <SunburstChart
      className="w-full"
      label={t(K.label)}
      centerLabel={t(K.revenue)}
      valueFormat={{ style: "currency", currency: "SAR", notation: "compact" }}
      items={TREE.map(([key, children]) => ({
        key,
        label: t(K[key]),
        children: children.map(([child, value]) => ({ key: child, label: t(K[child]), value })),
      }))}
    />
  );
}
