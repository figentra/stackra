/**
 * Stackra file contract:
 * Purpose: the "target" demo of the native GaugeChart: this month's sales against the monthly target.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (charts wave 2).
 */
import { GaugeChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { GAUGE_CHART_DEMO_KEYS } from "#src/demos/free/gauge-chart/gauge-chart-demo-keys.constant";

/** The demo's keys. */
const K = GAUGE_CHART_DEMO_KEYS.demo_free.gauge_chart.target;

/** Sales against the monthly target. */
export default function Target() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <GaugeChart
      value={72_400}
      max={100_000}
      target={80_000}
      valueFormat={{ style: "currency", currency: "SAR", notation: "compact" }}
      centerLabel={t(K.sold)}
      label={t(K.label)}
    />
  );
}
