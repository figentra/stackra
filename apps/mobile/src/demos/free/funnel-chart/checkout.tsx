/**
 * Stackra file contract:
 * Purpose: the "checkout" demo of the native FunnelChart: checkout funnel.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { FunnelChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FUNNEL_CHART_DEMO_KEYS } from "#src/demos/free/funnel-chart/funnel-chart-demo-keys.constant";

/** The demo's keys. */
const K = FUNNEL_CHART_DEMO_KEYS.demo_free.funnel_chart.checkout;

/** A month of checkout steps. */
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
      label={t(K.label)}
      stages={steps.map(([key, value]) => ({ key, label: t(K[key]), value }))}
    />
  );
}
