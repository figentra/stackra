/**
 * Stackra file contract:
 * Purpose: the "checkout" demo of the web FunnelChart: checkout funnel.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { FunnelChart, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FUNNEL_CHART_KEYS } from "#src/demos/free/funnel-chart/funnel-chart-keys.constant";

/** The demo's keys. */
const K = FUNNEL_CHART_KEYS.funnel_chart;

/** Funnel chart: a month of checkout steps. */
export default function Checkout() {
  const t = useCatalogueText(MESSAGES.en);
  const steps = [
    ["visited", 12_400],
    ["viewed", 6800],
    ["cart", 2900],
    ["checkout", 1700],
    ["paid", 1240],
  ] as const;
  return (
    <FunnelChart
      className="w-full max-w-xl"
      label={t(K.label)}
      stages={steps.map(([key, value]) => ({ key, label: t(K[key]), value }))}
    />
  );
}
