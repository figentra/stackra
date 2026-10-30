/**
 * Stackra file contract:
 * Purpose: the "log-scale" demo of the native LineChart: sign-ups across four powers of ten on a log value axis.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371.
 */
import { LineChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { LINE_CHART_DEMO_KEYS } from "#src/demos/free/line-chart/line-chart-demo-keys.constant";

/** The demo's keys. */
const K = LINE_CHART_DEMO_KEYS.demo_free.line_chart.log_scale;

const DATA = [
  { month: "2026-01-01", signups: 12 },
  { month: "2026-02-01", signups: 48 },
  { month: "2026-03-01", signups: 310 },
  { month: "2026-04-01", signups: 1250 },
  { month: "2026-05-01", signups: 6800 },
  { month: "2026-06-01", signups: 21_400 },
];

/** Growth that spans powers of ten, read on a log axis. */
export default function LogScale() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <LineChart
      label={t(K.label)}
      data={DATA}
      xKey="month"
      xFormat={{ month: "short" }}
      series={[{ key: "signups", label: t(K.signups), color: "chart-3" }]}
      valueScale="log"
      showValueAxis
      showDots
    />
  );
}
