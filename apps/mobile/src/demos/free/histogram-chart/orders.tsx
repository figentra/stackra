/**
 * Stackra file contract:
 * Purpose: the "orders" demo of the native HistogramChart: October's order totals counted into price bands.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371.
 */
import { HistogramChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { HISTOGRAM_CHART_DEMO_KEYS } from "#src/demos/free/histogram-chart/histogram-chart-demo-keys.constant";

/** The demo's keys. */
const K = HISTOGRAM_CHART_DEMO_KEYS.demo_free.histogram_chart.orders;

/** 240 order totals in riyals, a steady skewed spread so the demo draws the same every time. */
const TOTALS = Array.from({ length: 240 }, (_, index) => {
  const wave = Math.sin(index * 12.9898) * 43_758.5453;
  const spread = wave - Math.floor(wave);
  return Math.round(20 + 140 * spread * spread + ((index * 7) % 30));
});

/** October's order totals by price band. */
export default function Orders() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <HistogramChart
      values={TOTALS}
      binWidth={20}
      valueFormat={{ maximumFractionDigits: 0 }}
      label={t(K.label)}
    />
  );
}
