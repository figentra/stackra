/**
 * Stackra file contract:
 * Purpose: the "interactive" demo of the native AreaChart, in a chart card with the range picker, refresh and compare
 *          to the previous period: 90 days of visitors with a 7, 30 or 90 day range.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (Stackra's own charts).
 */
import { chartDataOf } from "@stackra/ui";
import { AreaChart, Button, WidgetFrame, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { AREA_CHART_DEMO_KEYS } from "#src/demos/free/area-chart/area-chart-demo-keys.constant";

/** The demo's keys. */
const K = AREA_CHART_DEMO_KEYS.demo_free.area_chart.interactive;

/** 90 days of visitors, ending 30 June 2026, in a slow swell with a weekly ripple, and the quarter before. */
const DATA = Array.from({ length: 90 }, (_, day) => ({
  date: new Date(Date.UTC(2026, 3, 2 + day)).toISOString().slice(0, 10),
  desktop: Math.round(260 + 90 * Math.sin(day / 9) + 35 * Math.sin(day / 2.5)),
  mobile: Math.round(170 + 60 * Math.cos(day / 11) + 25 * Math.sin(day / 3.1)),
  lastDesktop: Math.round(230 + 80 * Math.sin((day + 4) / 9) + 30 * Math.sin(day / 2.7)),
  lastMobile: Math.round(150 + 50 * Math.cos((day + 3) / 11) + 20 * Math.sin(day / 3.3)),
}));

/** The ranges offered, in days. */
const RANGES = [7, 30, 90] as const;

/** 90 days of visitors with a 7, 30 or 90 day range, in a chart card. */
export default function Interactive() {
  const t = useCatalogueText(MESSAGES.en);
  const [days, setDays] = useState<(typeof RANGES)[number]>(90);
  const [isComparing, setComparing] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(() => Date.now() - 120_000);
  const data = DATA.slice(-days);
  const series = [
    { key: "desktop", label: t(K.desktop), compareKey: "lastDesktop" },
    { key: "mobile", label: t(K.mobile), compareKey: "lastMobile" },
  ];
  return (
    <WidgetFrame
      title={t(K.title)}
      description={t(K.description)}
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
      menu={["table", "fullscreen"]}
      data={chartDataOf({
        data,
        series,
        categoryKey: "date",
        categoryLabel: t(K.date),
        categoryFormat: { month: "short", day: "numeric" },
        ...(isComparing ? { compareLabelOf: (item) => t(K.previous, { series: item.label }) } : {}),
      })}
      controls={
        <View className="flex-row flex-wrap gap-2">
          {RANGES.map((range) => (
            <Button
              key={range}
              size="sm"
              variant={range === days ? "secondary" : "ghost"}
              onPress={() => setDays(range)}
              accessibilityState={{ selected: range === days }}
            >
              {t(K[`range_${range}`])}
            </Button>
          ))}
        </View>
      }
    >
      <AreaChart
        data={data}
        series={series}
        xKey="date"
        xFormat={{ month: "short", day: "numeric" }}
        showComparison={isComparing}
        label={t(K.label, { days })}
      />
    </WidgetFrame>
  );
}
