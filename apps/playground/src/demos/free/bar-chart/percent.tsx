/**
 * Stackra file contract:
 * Purpose: the "percent" demo of the web BarChart: desktop and mobile visitors stacked to 100%, so each column shows the
 *          device mix rather than the volume, with the value axis in percent.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { BarChart, WidgetFrame, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BAR_CHART_KEYS } from "#src/demos/free/bar-chart/bar-chart-keys.constant";

/** The demo's keys. */
const K = BAR_CHART_KEYS.bar_chart;

/** Visitors by month. */
const DATA = [
  { month: "2026-01-01", desktop: 186, mobile: 80 },
  { month: "2026-02-01", desktop: 305, mobile: 200 },
  { month: "2026-03-01", desktop: 237, mobile: 120 },
  { month: "2026-04-01", desktop: 73, mobile: 190 },
  { month: "2026-05-01", desktop: 209, mobile: 130 },
  { month: "2026-06-01", desktop: 214, mobile: 140 },
];

/** The BarChart demo: percent. */
export default function Percent() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <WidgetFrame
      className="w-full"
      size="full"
      title={t(K.percent_title)}
      description={t(K.months_description)}
    >
      <BarChart
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
        label={t(K.percent_title)}
      />
    </WidgetFrame>
  );
}
