/**
 * Stackra file contract:
 * Purpose: the "target" demo of the web GaugeChart: this month's sales on a ring against the monthly target.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { GaugeChart, WidgetFrame, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { GAUGE_CHART_KEYS } from "#src/demos/free/gauge-chart/gauge-chart-keys.constant";

/** The demo's keys. */
const K = GAUGE_CHART_KEYS.gauge_chart;

/** Gauge chart: target. */
export default function Target() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <WidgetFrame
      className="w-full"
      size="small"
      title={t(K.target_title)}
      description={t(K.target_description)}
    >
      <GaugeChart
        className="mx-auto"
        value={72_400}
        max={100_000}
        target={80_000}
        valueFormat={{ style: "currency", currency: "SAR", notation: "compact" }}
        centerLabel={t(K.sold)}
        label={t(K.label)}
      />
    </WidgetFrame>
  );
}
