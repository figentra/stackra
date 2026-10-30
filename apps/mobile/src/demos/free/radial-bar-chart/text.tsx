/**
 * Stackra file contract:
 * Purpose: the "text" demo of the native RadialBarChart: one ring toward a goal, its total in the middle.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (Stackra's own charts).
 */
import { RadialBarChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RADIAL_BAR_CHART_DEMO_KEYS } from "#src/demos/free/radial-bar-chart/radial-bar-chart-demo-keys.constant";

/** The demo's keys. */
const K = RADIAL_BAR_CHART_DEMO_KEYS.demo_free.radial_bar_chart.text;

/** One ring toward a goal, its total in the middle. */
export default function Text() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <RadialBarChart
      data={[{ name: "visitors", value: 1260 }]}
      series={[{ key: "visitors", label: t(K.visitors), color: "chart-2" }]}
      nameKey="name"
      valueKey="value"
      maxValue={2000}
      centerLabel={t(K.centre)}
      label={t(K.label)}
    />
  );
}
