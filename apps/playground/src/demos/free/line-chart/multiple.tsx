/**
 * Stackra file contract:
 * Purpose: the "multiple" demo of the web Line chart, in a chart card with a target line, refresh, compare to the
 *          previous period, the legend toggles and the overflow menu: desktop and mobile visitors as two lines, January to June.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { chartDataOf } from "@stackra/ui";
import { LineChart, WidgetFrame, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { LINE_CHART_KEYS } from "#src/demos/free/line-chart/line-chart-keys.constant";

/** The demo's keys. */
const K = LINE_CHART_KEYS.line_chart;

/** Visitors by month, with the same months a year before. */
const DATA = [
  { month: "2026-01-01", desktop: 186, mobile: 80, lastDesktop: 160, lastMobile: 70 },
  { month: "2026-02-01", desktop: 305, mobile: 200, lastDesktop: 210, lastMobile: 150 },
  { month: "2026-03-01", desktop: 237, mobile: 120, lastDesktop: 250, lastMobile: 100 },
  { month: "2026-04-01", desktop: 73, mobile: 190, lastDesktop: 140, lastMobile: 120 },
  { month: "2026-05-01", desktop: 209, mobile: 130, lastDesktop: 170, lastMobile: 125 },
  { month: "2026-06-01", desktop: 214, mobile: 140, lastDesktop: 200, lastMobile: 90 },
];

/** Line chart: multiple. */
export default function Multiple() {
  const t = useCatalogueText(MESSAGES.en);
  const [isComparing, setComparing] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(() => Date.now() - 300_000);
  const series = [
    { key: "desktop", label: t(K.desktop), compareKey: "lastDesktop" },
    { key: "mobile", label: t(K.mobile), compareKey: "lastMobile" },
  ];
  return (
    <WidgetFrame
      className="w-full"
      size="full"
      title={t(K.multiple_title)}
      description={t(K.months_description)}
      updatedAt={updatedAt}
      isRefreshing={isRefreshing}
      onRefresh={() => {
        setRefreshing(true);
        setTimeout(() => {
          setRefreshing(false);
          setUpdatedAt(Date.now());
        }, 1200);
      }}
      isComparing={isComparing}
      onCompareChange={setComparing}
      menu={["csv", "png", "svg", "table", "fullscreen", "link"]}
      data={chartDataOf({
        data: DATA,
        series,
        categoryKey: "month",
        categoryLabel: t(K.month),
        categoryFormat: { month: "short" },
        ...(isComparing ? { compareLabelOf: (item) => t(K.previous, { series: item.label }) } : {}),
      })}
      footer={<span className="text-muted">{t(K.trend)}</span>}
    >
      <LineChart
        data={DATA}
        series={series}
        xKey="month"
        xFormat={{ month: "short" }}
        showComparison={isComparing}
        references={[{ value: 250, label: t(K.target) }]}
        label={t(K.multiple_title)}
      />
    </WidgetFrame>
  );
}
