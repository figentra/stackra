/**
 * Stackra file contract:
 * Purpose: the "multiple" demo of the native BarChart, in a chart card with a sort menu, compare to the previous
 *          period, the legend toggles and the table and full-screen menu: desktop and mobile visitors side by side.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (Stackra's own charts).
 */
import { chartDataOf } from "@stackra/ui";
import type { ChartSort } from "@stackra/ui/contracts";
import { BarChart, WidgetFrame, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { BAR_CHART_DEMO_KEYS } from "#src/demos/free/bar-chart/bar-chart-demo-keys.constant";

/** The demo's keys. */
const K = BAR_CHART_DEMO_KEYS.demo_free.bar_chart.multiple;

/** The rows the chart draws, with the same months a year before. */
const DATA = [
  { month: "2026-01-01", desktop: 186, mobile: 80, lastDesktop: 150, lastMobile: 64 },
  { month: "2026-02-01", desktop: 305, mobile: 200, lastDesktop: 240, lastMobile: 150 },
  { month: "2026-03-01", desktop: 237, mobile: 120, lastDesktop: 260, lastMobile: 110 },
  { month: "2026-04-01", desktop: 73, mobile: 190, lastDesktop: 120, lastMobile: 140 },
  { month: "2026-05-01", desktop: 209, mobile: 130, lastDesktop: 180, lastMobile: 120 },
  { month: "2026-06-01", desktop: 214, mobile: 140, lastDesktop: 190, lastMobile: 100 },
];

/** Desktop and mobile visitors side by side, in a chart card. */
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
      title={t(K.title)}
      description={t(K.description)}
      sort={sort}
      onSortChange={setSort}
      isComparing={isComparing}
      onCompareChange={setComparing}
      menu={["table", "fullscreen"]}
      data={chartDataOf({
        data: DATA,
        series,
        categoryKey: "month",
        categoryLabel: t(K.month),
        categoryFormat: { month: "short" },
        ...(isComparing ? { compareLabelOf: (item) => t(K.previous, { series: item.label }) } : {}),
      })}
    >
      <BarChart
        data={DATA}
        series={series}
        xKey="month"
        xFormat={{ month: "short" }}
        sort={sort}
        showComparison={isComparing}
        label={t(K.label)}
      />
    </WidgetFrame>
  );
}
