/**
 * Stackra file contract:
 * Purpose: the "simple" demo of the native PieChart: visitors' share by browser.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (Stackra's own charts).
 */
import { PieChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PIE_CHART_DEMO_KEYS } from "#src/demos/free/pie-chart/pie-chart-demo-keys.constant";

/** The demo's keys. */
const K = PIE_CHART_DEMO_KEYS.demo_free.pie_chart.simple;

/** The rows the chart draws. */
const DATA = [
  { browser: "chrome", visitors: 275 },
  { browser: "safari", visitors: 200 },
  { browser: "firefox", visitors: 187 },
  { browser: "edge", visitors: 173 },
  { browser: "other", visitors: 90 },
];

/** Visitors' share by browser. */
export default function Simple() {
  const t = useCatalogueText(MESSAGES.en);
  const series = [
    { key: "chrome", label: t(K.chrome) },
    { key: "safari", label: t(K.safari) },
    { key: "firefox", label: t(K.firefox) },
    { key: "edge", label: t(K.edge) },
    { key: "other", label: t(K.other) },
  ];
  return (
    <PieChart
      data={DATA}
      series={series}
      nameKey="browser"
      valueKey="visitors"
      label={t(K.label)}
    />
  );
}
