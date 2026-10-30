/**
 * Stackra file contract:
 * Purpose: the "multiple" demo of the native RadarChart: desktop and mobile visitors as two shapes.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (Stackra's own charts).
 */
import { RadarChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RADAR_CHART_DEMO_KEYS } from "#src/demos/free/radar-chart/radar-chart-demo-keys.constant";

/** The demo's keys. */
const K = RADAR_CHART_DEMO_KEYS.demo_free.radar_chart.multiple;

/** The rows the chart draws. */
const DATA = [
  { month: "2026-01-01", desktop: 186, mobile: 80 },
  { month: "2026-02-01", desktop: 305, mobile: 200 },
  { month: "2026-03-01", desktop: 237, mobile: 120 },
  { month: "2026-04-01", desktop: 73, mobile: 190 },
  { month: "2026-05-01", desktop: 209, mobile: 130 },
  { month: "2026-06-01", desktop: 214, mobile: 140 },
];

/** Desktop and mobile visitors as two shapes. */
export default function Multiple() {
  const t = useCatalogueText(MESSAGES.en);
  const series = [
    { key: "desktop", label: t(K.desktop) },
    { key: "mobile", label: t(K.mobile) },
  ];
  return (
    <RadarChart
      data={DATA}
      series={series}
      xKey="month"
      xFormat={{ month: "short" }}
      label={t(K.label)}
    />
  );
}
