/**
 * Stackra file contract:
 * Purpose: the "axes" demo of the native AreaChart: revenue with its value axis in the locale's currency.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (Stackra's own charts).
 */
import { AreaChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { AREA_CHART_DEMO_KEYS } from "#src/demos/free/area-chart/area-chart-demo-keys.constant";

/** The demo's keys. */
const K = AREA_CHART_DEMO_KEYS.demo_free.area_chart.axes;

/** The rows the chart draws. */
const DATA = [
  { month: "2026-01-01", revenue: 18_600 },
  { month: "2026-02-01", revenue: 30_500 },
  { month: "2026-03-01", revenue: 23_700 },
  { month: "2026-04-01", revenue: 27_300 },
  { month: "2026-05-01", revenue: 20_900 },
  { month: "2026-06-01", revenue: 31_400 },
];

/** Revenue with its value axis in the locale's currency. */
export default function Axes() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <AreaChart
      data={DATA}
      series={[{ key: "revenue", label: t(K.revenue), color: "chart-2" }]}
      xKey="month"
      xFormat={{ month: "short" }}
      valueFormat={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
      showValueAxis
      label={t(K.label)}
    />
  );
}
