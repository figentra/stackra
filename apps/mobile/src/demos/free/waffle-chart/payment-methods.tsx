/**
 * Stackra file contract:
 * Purpose: the "payment-methods" demo of the native WaffleChart: how October's 1,000 orders were paid, one square per
 *          ten orders, with each method's count and share in the legend.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { WaffleChart, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { WAFFLE_CHART_DEMO_KEYS } from "#src/demos/free/waffle-chart/waffle-chart-demo-keys.constant";

/** The demo's keys. */
const K = WAFFLE_CHART_DEMO_KEYS.demo_free.waffle_chart.payment_methods;

/** Orders per payment method, largest first. */
const DATA = [
  { method: "card", orders: 486 },
  { method: "cod", orders: 274 },
  { method: "wallet", orders: 168 },
  { method: "later", orders: 72 },
];

/** WaffleChart: Payment methods. */
export default function PaymentMethods() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <WaffleChart
      data={DATA}
      series={[
        { key: "card", label: t(K.card) },
        { key: "cod", label: t(K.cod) },
        { key: "wallet", label: t(K.wallet) },
        { key: "later", label: t(K.later) },
      ]}
      nameKey="method"
      valueKey="orders"
      label={t(K.label)}
    />
  );
}
