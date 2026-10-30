/**
 * Stackra file contract:
 * Purpose: the "multiple" demo of the web Bar chart: desktop and mobile visitors side by side, January to June, in a chart card with a sort menu, compare to the
 *          previous period, the legend toggles and the overflow menu.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { chartDataOf } from "@stackra/ui";
import type { ChartSort } from "@stackra/ui/contracts";
import { BarChart, WidgetFrame, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BAR_CHART_KEYS } from "#src/demos/free/bar-chart/bar-chart-keys.constant";

/** The demo's keys. */
const K = BAR_CHART_KEYS.bar_chart;

/** Visitors by month, with the same months a year before. */
const DATA = [
  { month: "2026-01-01", desktop: 186, mobile: 80, lastDesktop: 150, lastMobile: 64 },
  { month: "2026-02-01", desktop: 305, mobile: 200, lastDesktop: 240, lastMobile: 150 },
  { month: "2026-03-01", desktop: 237, mobile: 120, lastDesktop: 260, lastMobile: 110 },
  { month: "2026-04-01", desktop: 73, mobile: 190, lastDesktop: 120, lastMobile: 140 },
  { month: "2026-05-01", desktop: 209, mobile: 130, lastDesktop: 180, lastMobile: 120 },
  { month: "2026-06-01", desktop: 214, mobile: 140, lastDesktop: 190, lastMobile: 100 },
];

/** Bar chart: multiple. */
export default function Multiple() {
  const t = useCatalogueText(MESSAGES.en);
  const [sort, setSort] = useState<ChartSort | undefined>();
  const [isComparing, setComparing] = useState(false);
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
      sort={sort}
      onSortChange={setSort}
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
      <BarChart
        data={DATA}
        series={series}
        xKey="month"
        xFormat={{ month: "short" }}
        sort={sort}
        showComparison={isComparing}
        label={t(K.multiple_title)}
      />
    </WidgetFrame>
  );
}
