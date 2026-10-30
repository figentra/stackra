/**
 * Stackra file contract:
 * Purpose: the "interactive" demo of the web Area chart: the last 90 days of desktop and mobile visitors with a range toggle (7 days, 30 days, 3 months), in a chart card: refresh, compare to the previous period, a brush to zoom, and the overflow menu (CSV, PNG, table, full screen, link).
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { chartDataOf } from "@stackra/ui";
import {
  AreaChart,
  ToggleButton,
  ToggleButtonGroup,
  WidgetFrame,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { AREA_CHART_KEYS } from "#src/demos/free/area-chart/area-chart-keys.constant";

/** The demo's keys. */
const K = AREA_CHART_KEYS.area_chart;

/** 90 days of visitors from 1 April 2026 and the same days a quarter before, a steady wave so it draws the same every time. */
const DAYS = Array.from({ length: 90 }, (_, day) => ({
  date: new Date(Date.UTC(2026, 3, 1 + day)).toISOString().slice(0, 10),
  desktop: Math.round(260 + 140 * Math.sin(day / 5) + ((day * 37) % 60)),
  mobile: Math.round(180 + 90 * Math.cos(day / 7) + ((day * 53) % 50)),
  lastDesktop: Math.round(220 + 120 * Math.sin((day + 3) / 5) + ((day * 29) % 50)),
  lastMobile: Math.round(150 + 80 * Math.cos((day + 2) / 7) + ((day * 41) % 40)),
}));

/** The ranges people pick, in days. */
const RANGES = ["90", "30", "7"] as const;

/** Area chart: interactive. */
export default function Interactive() {
  const t = useCatalogueText(MESSAGES.en);
  const [range, setRange] = useState<(typeof RANGES)[number]>("90");
  const [isComparing, setComparing] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(() => Date.now() - 120_000);
  const data = DAYS.slice(-Number(range));
  const series = [
    { key: "desktop", label: t(K.desktop), compareKey: "lastDesktop" },
    { key: "mobile", label: t(K.mobile), compareKey: "lastMobile" },
  ];
  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setUpdatedAt(Date.now());
    }, 1200);
  };
  return (
    <WidgetFrame
      className="w-full"
      size="full"
      title={t(K.interactive_title)}
      description={t(K.interactive_description)}
      updatedAt={updatedAt}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      isComparing={isComparing}
      onCompareChange={setComparing}
      menu={["csv", "png", "table", "fullscreen", "link"]}
      data={chartDataOf({
        data,
        series,
        categoryKey: "date",
        categoryLabel: t(K.date),
        categoryFormat: { month: "short", day: "numeric" },
        ...(isComparing ? { compareLabelOf: (item) => t(K.previous, { series: item.label }) } : {}),
      })}
      controls={
        <ToggleButtonGroup
          aria-label={t(K.range)}
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[range]}
          onSelectionChange={(keys) => {
            const picked = RANGES.find((value) => keys.has(value));
            if (picked) setRange(picked);
          }}
        >
          {RANGES.map((value) => (
            <ToggleButton key={value} id={value}>
              {t(K[`range_${value}`])}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      }
    >
      <AreaChart
        data={data}
        series={series}
        xKey="date"
        xFormat={{ month: "short", day: "numeric" }}
        stacked={!isComparing}
        showComparison={isComparing}
        showBrush={range === "90"}
        label={t(K.interactive_title)}
        height={260}
      />
    </WidgetFrame>
  );
}
