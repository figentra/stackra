/**
 * Stackra file contract:
 * Purpose: the "bridge" demo of the native WaterfallChart: the profit bridge from Q3 to Q4.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (charts wave 2).
 */
import { WaterfallChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { WATERFALL_CHART_DEMO_KEYS } from "#src/demos/free/waterfall-chart/waterfall-chart-demo-keys.constant";

/** The demo's keys. */
const K = WATERFALL_CHART_DEMO_KEYS.demo_free.waterfall_chart.bridge;

/** The profit bridge from Q3 to Q4. */
export default function Bridge() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <WaterfallChart
      start={{ label: t(K.start), value: 120_000 }}
      steps={[
        { key: "new", label: t(K.new_customers), value: 45_000 },
        { key: "upsell", label: t(K.upsell), value: 18_000 },
        { key: "churn", label: t(K.churn), value: -22_000 },
        { key: "refunds", label: t(K.refunds), value: -9000 },
        { key: "costs", label: t(K.costs), value: -15_000 },
      ]}
      endLabel={t(K.end)}
      valueFormat={{ style: "currency", currency: "SAR", notation: "compact" }}
      label={t(K.label)}
    />
  );
}
