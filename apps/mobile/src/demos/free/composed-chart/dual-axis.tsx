/**
 * Stackra file contract:
 * Purpose: the "dual-axis" demo of the native ComposedChart: visitors as columns on the first value axis, orders as a
 *          line on a second axis at the reading end.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371.
 */
import { ComposedChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { COMPOSED_CHART_DEMO_KEYS } from "#src/demos/free/composed-chart/composed-chart-demo-keys.constant";

/** The demo's keys. */
const K = COMPOSED_CHART_DEMO_KEYS.demo_free.composed_chart.dual_axis;

const DATA = [
  { month: "2026-01-01", visitors: 18_600, orders: 212 },
  { month: "2026-02-01", visitors: 30_500, orders: 388 },
  { month: "2026-03-01", visitors: 23_700, orders: 301 },
  { month: "2026-04-01", visitors: 27_300, orders: 455 },
  { month: "2026-05-01", visitors: 34_900, orders: 512 },
  { month: "2026-06-01", visitors: 41_400, orders: 640 },
];

/** Two measures a hundred times apart, each on its own value axis. */
export default function DualAxis() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ComposedChart
      label={t(K.label)}
      data={DATA}
      xKey="month"
      xFormat={{ month: "short" }}
      series={[
        { key: "visitors", label: t(K.visitors) },
        { key: "orders", label: t(K.orders), color: "chart-3" },
      ]}
      lineKeys={["orders"]}
      secondaryKeys={["orders"]}
      showValueAxis
    />
  );
}
