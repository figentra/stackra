/**
 * Stackra file contract:
 * Purpose: the "annotations" demo of the native LineChart: visitors with a target line and notes pinned to the launch
 *          and outage months.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371.
 */
import { LineChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { LINE_CHART_DEMO_KEYS } from "#src/demos/free/line-chart/line-chart-demo-keys.constant";

/** The demo's keys. */
const K = LINE_CHART_DEMO_KEYS.demo_free.line_chart.annotations;

const DATA = [
  { month: "2026-01-01", desktop: 186 },
  { month: "2026-02-01", desktop: 205 },
  { month: "2026-03-01", desktop: 237 },
  { month: "2026-04-01", desktop: 143 },
  { month: "2026-05-01", desktop: 289 },
  { month: "2026-06-01", desktop: 314 },
];

/** A target line and two notes pinned to their months. */
export default function Annotations() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <LineChart
      label={t(K.label)}
      data={DATA}
      xKey="month"
      xFormat={{ month: "short" }}
      series={[{ key: "desktop", label: t(K.visitors) }]}
      showDots
      references={[{ value: 250, label: t(K.target) }]}
      annotations={[
        { at: "2026-02-01", label: t(K.launch), color: "chart-2" },
        { at: "2026-04-01", label: t(K.outage), color: "danger" },
      ]}
    />
  );
}
