/**
 * Stackra file contract:
 * Purpose: the "plain" demo of the native DonutChart: the ring with a legend and no total.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (Stackra's own charts).
 */
import { DonutChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DONUT_CHART_DEMO_KEYS } from "#src/demos/free/donut-chart/donut-chart-demo-keys.constant";

/** The demo's keys. */
const K = DONUT_CHART_DEMO_KEYS.demo_free.donut_chart.plain;

/** The rows the chart draws. */
const DATA = [
  { browser: "chrome", visitors: 275 },
  { browser: "safari", visitors: 200 },
  { browser: "firefox", visitors: 187 },
  { browser: "edge", visitors: 173 },
  { browser: "other", visitors: 90 },
];

/** The ring with a legend and no total. */
export default function Plain() {
  const t = useCatalogueText(MESSAGES.en);
  const series = [
    { key: "chrome", label: t(K.chrome) },
    { key: "safari", label: t(K.safari) },
    { key: "firefox", label: t(K.firefox) },
    { key: "edge", label: t(K.edge) },
    { key: "other", label: t(K.other) },
  ];
  return (
    <DonutChart
      data={DATA}
      series={series}
      nameKey="browser"
      valueKey="visitors"
      label={t(K.label)}
      showLegend
    />
  );
}
