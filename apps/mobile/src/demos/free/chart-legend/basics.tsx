/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Chart legend: three sales channels named with their palette colours, and the dashed
 *          previous-period entry.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); STA-1371.
 */
import type { ChartSeries } from "@stackra/ui/contracts";
import { ChartLegend, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHART_LEGEND_DEMO_KEYS } from "#src/demos/free/chart-legend/chart-legend-demo-keys.constant";

/** The demo's keys. */
const K = CHART_LEGEND_DEMO_KEYS.demo_free.chart_legend.sample;

/** Chart legend: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const series: readonly ChartSeries[] = [
    { key: "online", label: t(K.online) },
    { key: "store", label: t(K.in_store) },
    { key: "phone", label: t(K.phone) },
  ];
  return (
    <View className="gap-4">
      <ChartLegend series={series} />
      <ChartLegend series={series} palette="categorical" showComparison />
    </View>
  );
}
