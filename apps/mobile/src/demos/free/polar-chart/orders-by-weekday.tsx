/**
 * Stackra file contract:
 * Purpose: the "orders-by-weekday" demo of the native PolarChart: a store's orders over the last four weeks, one slice
 *          per weekday from Saturday.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { PolarChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { POLAR_CHART_DEMO_KEYS } from "#src/demos/free/polar-chart/polar-chart-demo-keys.constant";

/** The demo's keys. */
const K = POLAR_CHART_DEMO_KEYS.demo_free.polar_chart.orders_by_weekday;

/** Orders per weekday; each row is a date of that weekday, written as its short name. */
const DATA = [
  { day: "2026-10-24", orders: 820 },
  { day: "2026-10-25", orders: 640 },
  { day: "2026-10-26", orders: 590 },
  { day: "2026-10-27", orders: 610 },
  { day: "2026-10-28", orders: 700 },
  { day: "2026-10-29", orders: 1180 },
  { day: "2026-10-30", orders: 1420 },
];

/** PolarChart: Orders by weekday. */
export default function OrdersByWeekday() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <PolarChart
      data={DATA}
      series={[{ key: "orders", label: t(K.orders) }]}
      xKey="day"
      xFormat={{ weekday: "short" }}
      label={t(K.label)}
    />
  );
}
