/**
 * Stackra file contract:
 * Purpose: the "categories" demo of the native TreemapChart: revenue by category.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { TreemapChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TREEMAP_CHART_DEMO_KEYS } from "#src/demos/free/treemap-chart/treemap-chart-demo-keys.constant";

/** The demo's keys. */
const K = TREEMAP_CHART_DEMO_KEYS.demo_free.treemap_chart.categories;

/** A quarter's revenue by category. */
export default function Categories() {
  const t = useCatalogueText(MESSAGES.en);
  const tiles = [
    ["coffee", 42_000],
    ["bakery", 23_000],
    ["beans", 15_000],
    ["catering", 12_000],
    ["merch", 8000],
    ["gift", 5000],
  ] as const;
  return (
    <TreemapChart
      label={t(K.label)}
      valueFormat={{ style: "currency", currency: "SAR", notation: "compact" }}
      items={tiles.map(([key, value]) => ({ key, label: t(K[key]), value }))}
    />
  );
}
