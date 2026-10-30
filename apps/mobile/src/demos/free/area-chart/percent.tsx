/**
 * Stackra file contract:
 * Purpose: the "percent" demo of the native AreaChart: desktop and mobile visitors stacked to 100%, the device mix by month.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (charts wave 2).
 */
import { AreaChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { AREA_CHART_DEMO_KEYS } from "#src/demos/free/area-chart/area-chart-demo-keys.constant";

/** The demo's keys. */
const K = AREA_CHART_DEMO_KEYS.demo_free.area_chart.percent;

/** The rows the chart draws. */
const DATA = [
  { month: "2026-01-01", desktop: 186, mobile: 80 },
  { month: "2026-02-01", desktop: 305, mobile: 200 },
  { month: "2026-03-01", desktop: 237, mobile: 120 },
  { month: "2026-04-01", desktop: 73, mobile: 190 },
  { month: "2026-05-01", desktop: 209, mobile: 130 },
  { month: "2026-06-01", desktop: 214, mobile: 140 },
];

/** The device mix, stacked to 100%. */
export default function Percent() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <AreaChart
      data={DATA}
      series={[
        { key: "desktop", label: t(K.desktop) },
        { key: "mobile", label: t(K.mobile) },
      ]}
      xKey="month"
      xFormat={{ month: "short" }}
      stacked
      isNormalized
      showValueAxis
      label={t(K.label)}
    />
  );
}
