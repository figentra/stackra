/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Chart legend: three sales channels named with their palette colours, and the dashed
 *          previous-period entry.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import type { ChartSeries } from "@stackra/ui/contracts";
import { ChartLegend, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHART_LEGEND_KEYS } from "#src/demos/free/chart-legend/chart-legend-keys.constant";

/** The demo's keys. */
const K = CHART_LEGEND_KEYS.chart_legend;

/** Chart legend: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const series: readonly ChartSeries[] = [
    { key: "online", label: t(K.online) },
    { key: "store", label: t(K.in_store) },
    { key: "phone", label: t(K.phone) },
  ];
  return (
    <div className="grid gap-4">
      <ChartLegend series={series} />
      <ChartLegend series={series} palette="categorical" showComparison />
    </div>
  );
}
