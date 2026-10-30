/**
 * Stackra file contract:
 * Purpose: the "temperature" demo of the native RangeBarChart: Riyadh's average daily low and high temperature for each month.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371.
 */
import { RangeBarChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RANGE_BAR_CHART_DEMO_KEYS } from "#src/demos/free/range-bar-chart/range-bar-chart-demo-keys.constant";

/** The demo's keys. */
const K = RANGE_BAR_CHART_DEMO_KEYS.demo_free.range_bar_chart.temperature;

/** Average daily low and high in °C, by month. */
const MONTHS = [
  [9, 21],
  [11, 24],
  [15, 28],
  [20, 33],
  [26, 40],
  [28, 43],
  [29, 44],
  [29, 44],
  [26, 41],
  [21, 35],
  [15, 28],
  [10, 22],
].map(([low, high], month) => ({
  month: new Date(Date.UTC(2025, month, 1)).toISOString().slice(0, 10),
  low,
  high,
}));

/** Riyadh's temperature range by month. */
export default function Temperature() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <RangeBarChart
      data={MONTHS}
      xKey="month"
      xFormat={{ month: "narrow" }}
      fromKey="low"
      toKey="high"
      valueFormat={{ style: "unit", unit: "celsius" }}
      label={t(K.label)}
    />
  );
}
