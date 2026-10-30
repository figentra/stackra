/**
 * Stackra file contract:
 * Purpose: the "revenue-target" demo of the web ComposedChart: revenue against target.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { ComposedChart, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { COMPOSED_CHART_KEYS } from "#src/demos/free/composed-chart/composed-chart-keys.constant";

/** The demo's keys. */
const K = COMPOSED_CHART_KEYS.composed_chart;

/** Six months of revenue and the monthly target. */
const DATA = [
  { month: "2026-01-01", revenue: 18_600, target: 17_000 },
  { month: "2026-02-01", revenue: 30_500, target: 22_000 },
  { month: "2026-03-01", revenue: 23_700, target: 26_000 },
  { month: "2026-04-01", revenue: 27_300, target: 28_000 },
  { month: "2026-05-01", revenue: 34_900, target: 30_000 },
  { month: "2026-06-01", revenue: 41_400, target: 33_000 },
];

/** Composed chart: revenue as columns, the target as a line. */
export default function RevenueTarget() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ComposedChart
      className="w-full"
      label={t(K.label)}
      data={DATA}
      xKey="month"
      xFormat={{ month: "short" }}
      valueFormat={{ style: "currency", currency: "SAR", maximumFractionDigits: 0 }}
      series={[
        { key: "revenue", label: t(K.revenue) },
        { key: "target", label: t(K.target) },
      ]}
      showValueAxis
    />
  );
}
