/**
 * Stackra file contract:
 * Purpose: the "bridge" demo of the web WaterfallChart: the profit bridge from Q3 to Q4, rises and falls between the two totals.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { WaterfallChart, WidgetFrame, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { WATERFALL_CHART_KEYS } from "#src/demos/free/waterfall-chart/waterfall-chart-keys.constant";

/** The demo's keys. */
const K = WATERFALL_CHART_KEYS.waterfall_chart;

/** Waterfall chart: bridge. */
export default function Bridge() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <WidgetFrame
      className="w-full"
      size="full"
      title={t(K.bridge_title)}
      description={t(K.bridge_description)}
    >
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
    </WidgetFrame>
  );
}
