/**
 * Stackra file contract:
 * Purpose: the "launch" demo of the native TimelineChart: a quarter's launch plan in three lanes, with today marked.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { TimelineChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TIMELINE_CHART_DEMO_KEYS } from "#src/demos/free/timeline-chart/timeline-chart-demo-keys.constant";

/** The demo's keys. */
const K = TIMELINE_CHART_DEMO_KEYS.demo_free.timeline_chart.launch;

/** The plan's tasks: lane, task, first day and last day. */
const TASKS = [
  ["design", "research", "2026-10-01", "2026-10-16"],
  ["design", "screens", "2026-10-19", "2026-11-13"],
  ["build", "api", "2026-10-26", "2026-11-27"],
  ["build", "app", "2026-11-09", "2026-12-11"],
  ["launch", "beta", "2026-12-01", "2026-12-15"],
  ["launch", "release", "2026-12-16", "2026-12-22"],
] as const;

/** Timeline chart: launch. */
export default function Launch() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <TimelineChart
      label={t(K.label)}
      today="2026-11-16"
      rows={(["design", "build", "launch"] as const).map((key) => ({ key, label: t(K[key]) }))}
      tasks={TASKS.map(([rowKey, key, start, end]) => ({
        key,
        rowKey,
        label: t(K[key]),
        start,
        end,
      }))}
    />
  );
}
